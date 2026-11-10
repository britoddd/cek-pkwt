"""Regulation Search: custom Langflow component for CekPKWT.

Replaces the stock Astra DB components in answer_labor_rule_question and check_work_contract. The
stock component rebuilds its Astra DB client, lists collections, counts documents, re-detects the
collection and embeds the query on every run, once per component. This one keeps the Astra DB and
Google clients for the life of the Langflow process and runs all searches at the same time:
  - Current Rules:  regime "current". With Topic Queries (the check flow): one search per topic line,
                    top Results per Topic each, merged without duplicates. Ranking the whole contract
                    as one query returned the same generic articles for every contract, so the article
                    for each clause was rarely retrieved. The topic vectors are fixed and cached.
                    Without Topic Queries (the ask flow): the query itself, top Current Rules Results.
  - New Law Rules:  regime "uu_pk_2026", ranked by the query.
  - Minimum Wages:  filter only (topic "upah_minimum", status "berlaku"), no embedding;
                    skipped when Minimum Wage Results is 0 (the ask flow).

Paste this whole file into Langflow: Components sidebar -> "New Custom Component" -> Code -> Save.
"""

import sys
import time
import types
from concurrent.futures import ThreadPoolExecutor

from lfx.custom.custom_component.component import Component
from lfx.io import IntInput, MessageTextInput, MultilineInput, Output, SecretStrInput, StrInput
from lfx.schema.data import Data

NEW_LAW_REGIME = "uu_pk_2026"
# Wage rows come through the Minimum Wages output; keep them out of the topic searches.
TOPIC_FILTER = {"metadata.regime": "current", "metadata.topic": {"$ne": "upah_minimum"}}

# Kept in a module of its own so the clients survive Langflow re-running this file.
_CACHE = sys.modules.setdefault("cekpkwt_regulation_search_cache", types.ModuleType("cekpkwt_regulation_search_cache")).__dict__


def _collection(endpoint: str, token: str, keyspace: str, name: str):
    key = ("collection", endpoint, token, keyspace, name)
    if key not in _CACHE:
        from astrapy import DataAPIClient

        _CACHE[key] = DataAPIClient().get_database(endpoint, token=token, keyspace=keyspace).get_collection(name)
    return _CACHE[key]


def _embedder(model: str, api_key: str):
    key = ("embedder", model, api_key)
    if key not in _CACHE:
        # Same class Langflow's Astra DB component uses, so query vectors match the ingested ones.
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        _CACHE[key] = GoogleGenerativeAIEmbeddings(model=model, google_api_key=api_key)
    return _CACHE[key]


def _topic_vector(embedder, model: str, topic: str) -> list[float]:
    # Topic lines are fixed text, so each is embedded once per process. Contract text is never cached.
    key = ("topic_vector", model, topic)
    if key not in _CACHE:
        _CACHE[key] = embedder.embed_query(topic)
    return _CACHE[key]


def _find(collection, filter_: dict, limit: int, vector: list[float] | None = None) -> list[Data]:
    # Documents follow the langchain-astradb layout written by ingest_labor_corpus. The text field is
    # "page_content" when the stock component created the collection, "content" otherwise.
    try:
        docs = list(collection.find(
            filter_,
            sort={"$vector": vector} if vector is not None else None,
            limit=limit,
            projection={"page_content": True, "content": True, "metadata": True},
        ))
    except Exception as exc:
        # backend/app.py looks for "astra" in Langflow's error to tell the user the database is waking up.
        raise RuntimeError(f"Astra DB search failed (the database may be hibernating): {exc}") from exc
    return [
        Data(data={**(d.get("metadata") or {}), "text": d.get("page_content") or d.get("content") or ""})
        for d in docs
    ]


def _merge(lists: list[list[Data]]) -> list[Data]:
    seen, merged = set(), []
    for rows in lists:
        for row in rows:
            key = row.data.get("id") or row.data.get("text")
            if key not in seen:
                seen.add(key)
                merged.append(row)
    return merged


class RegulationSearch(Component):
    display_name = "Regulation Search (CekPKWT)"
    description = (
        "Searches corpus_v1 in Astra DB for the current rules (per topic or by query), the new labor law "
        "rules and (optionally) the minimum wages, with all searches in parallel."
    )
    icon = "search"
    name = "RegulationSearch"

    inputs = [
        MessageTextInput(name="search_query", display_name="Query", info="Question or redacted contract.", required=True),
        SecretStrInput(name="token", display_name="Astra DB Application Token", value="ASTRA_DB_PKWT", required=True),
        StrInput(name="api_endpoint", display_name="Astra DB API Endpoint", required=True),
        StrInput(name="keyspace", display_name="Keyspace", value="default_keyspace", advanced=True),
        StrInput(name="collection_name", display_name="Collection", value="corpus_v1"),
        SecretStrInput(name="google_api_key", display_name="Google API Key", value="GOOGLE_API_KEY", required=True),
        StrInput(name="embedding_model", display_name="Embedding Model", value="models/gemini-embedding-001", advanced=True),
        MultilineInput(
            name="topic_queries",
            display_name="Topic Queries",
            info="One search per line for Current Rules. Empty: search with the query itself.",
            value="",
        ),
        IntInput(name="topic_results", display_name="Results per Topic", value=2),
        IntInput(name="current_results", display_name="Current Rules Results", info="Used without Topic Queries.", value=4),
        IntInput(name="new_law_results", display_name="New Law Results", value=2),
        IntInput(
            name="wage_results",
            display_name="Minimum Wage Results",
            info="Minimum wage entries currently in force, no similarity ranking. 0 skips the search.",
            value=0,
        ),
    ]

    outputs = [
        # group_outputs=True gives each output its own handle; without it Langflow shows one handle with a
        # dropdown, so only one output could be connected at a time.
        Output(display_name="Current Rules", name="current_rules", method="current_rules", group_outputs=True),
        Output(display_name="New Law Rules", name="new_law_rules", method="new_law_rules", group_outputs=True),
        Output(display_name="Minimum Wages", name="minimum_wages", method="minimum_wages", group_outputs=True),
    ]

    def _search(self) -> dict[str, list[Data]]:
        # All outputs are built on the same instance; search once. Stored in __dict__ directly because
        # Component routes attribute access through its own inputs/outputs handling.
        results = self.__dict__.get("_regulation_results")
        if results is not None:
            return results
        t0 = time.perf_counter()
        collection = _collection(self.api_endpoint, self.token, self.keyspace, self.collection_name)
        embedder = _embedder(self.embedding_model, self.google_api_key)
        query = (self.search_query or "").strip()
        topics = [t.strip() for t in (self.topic_queries or "").splitlines() if t.strip()]

        def topic_search(topic: str) -> list[Data]:
            return _find(collection, TOPIC_FILTER, self.topic_results, _topic_vector(embedder, self.embedding_model, topic))

        with ThreadPoolExecutor(8) as pool:
            # Searches that need no query vector start at once, while the query is being embedded.
            wages = (
                pool.submit(_find, collection, {"metadata.topic": "upah_minimum", "metadata.status": "berlaku"},
                            self.wage_results)
                if self.wage_results > 0 else None
            )
            by_topic = [pool.submit(topic_search, t) for t in topics]
            current = new_law = None
            if query and (self.new_law_results > 0 or not topics):
                vector = embedder.embed_query(query)
                if not topics:
                    current = pool.submit(_find, collection, {"metadata.regime": "current"}, self.current_results, vector)
                if self.new_law_results > 0:
                    new_law = pool.submit(_find, collection, {"metadata.regime": NEW_LAW_REGIME}, self.new_law_results, vector)
            results = {
                "current": _merge([f.result() for f in by_topic]) if topics else (current.result() if current else []),
                "new_law": new_law.result() if new_law else [],
                "wages": wages.result() if wages else [],
            }
        self.log(f"{time.perf_counter() - t0:.2f}s, {len(topics)} topics, "
                 + ", ".join(f"{len(v)} {k}" for k, v in results.items()))
        self.__dict__["_regulation_results"] = results
        return results

    def current_rules(self) -> list[Data]:
        rules = self._search()["current"]
        self.status = rules
        return rules

    def new_law_rules(self) -> list[Data]:
        return self._search()["new_law"]

    def minimum_wages(self) -> list[Data]:
        return self._search()["wages"]
