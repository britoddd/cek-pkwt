"""Regulation Search: custom Langflow component for CekPKWT.

Replaces the two stock Astra DB components in answer_labor_rule_question. The stock component
rebuilds its Astra DB client, lists collections, counts documents, re-detects the collection and
embeds the question on every run, and the flow had two of them. This one keeps the Astra DB and
Google clients for the life of the Langflow process, embeds the question once, and runs the
"current" and "uu_pk_2026" searches at the same time.

Paste this whole file into Langflow: Components sidebar -> "New Custom Component" -> Code -> Save.
"""

import sys
import time
import types
from concurrent.futures import ThreadPoolExecutor

from lfx.custom.custom_component.component import Component
from lfx.io import IntInput, MessageTextInput, Output, SecretStrInput, StrInput
from lfx.schema.data import Data

NEW_LAW_REGIME = "uu_pk_2026"

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


def _find(collection, vector: list[float], regime: str, limit: int) -> list[Data]:
    # Documents follow the langchain-astradb layout written by ingest_labor_corpus. The text field is
    # "page_content" when the stock component created the collection, "content" otherwise.
    docs = collection.find(
        {"metadata.regime": regime},
        sort={"$vector": vector},
        limit=limit,
        projection={"page_content": True, "content": True, "metadata": True},
    )
    return [
        Data(data={**(d.get("metadata") or {}), "text": d.get("page_content") or d.get("content") or ""})
        for d in docs
    ]


class RegulationSearch(Component):
    display_name = "Regulation Search (CekPKWT)"
    description = (
        "Searches corpus_v1 in Astra DB for the current rules and the new labor law rules, "
        "with one embedding and both searches in parallel."
    )
    icon = "search"
    name = "RegulationSearch"

    inputs = [
        MessageTextInput(name="search_query", display_name="Question", info="Connect Chat Input here.", required=True),
        SecretStrInput(name="token", display_name="Astra DB Application Token", value="ASTRA_DB_PKWT", required=True),
        StrInput(name="api_endpoint", display_name="Astra DB API Endpoint", required=True),
        StrInput(name="keyspace", display_name="Keyspace", value="default_keyspace", advanced=True),
        StrInput(name="collection_name", display_name="Collection", value="corpus_v1"),
        SecretStrInput(name="google_api_key", display_name="Google API Key", value="GOOGLE_API_KEY", required=True),
        StrInput(name="embedding_model", display_name="Embedding Model", value="models/gemini-embedding-001", advanced=True),
        IntInput(name="current_results", display_name="Current Rules Results", value=4),
        IntInput(name="new_law_results", display_name="New Law Results", value=2),
    ]

    outputs = [
        Output(display_name="Current Rules", name="current_rules", method="current_rules"),
        Output(display_name="New Law Rules", name="new_law_rules", method="new_law_rules"),
    ]

    def _search(self) -> tuple[list[Data], list[Data]]:
        # Both outputs are built on the same instance; search once. Stored in __dict__ directly because
        # Component routes attribute access through its own inputs/outputs handling.
        results = self.__dict__.get("_regulation_results")
        if results is not None:
            return results
        query = (self.search_query or "").strip()
        if not query:
            results = ([], [])
        else:
            t0 = time.perf_counter()
            vector = _embedder(self.embedding_model, self.google_api_key).embed_query(query)
            t1 = time.perf_counter()
            collection = _collection(self.api_endpoint, self.token, self.keyspace, self.collection_name)
            with ThreadPoolExecutor(2) as pool:
                current = pool.submit(_find, collection, vector, "current", self.current_results)
                new_law = pool.submit(_find, collection, vector, NEW_LAW_REGIME, self.new_law_results)
                results = (current.result(), new_law.result())
            self.log(f"embed {t1 - t0:.2f}s, search {time.perf_counter() - t1:.2f}s, "
                     f"{len(results[0])} current + {len(results[1])} new law")
        self.__dict__["_regulation_results"] = results
        return results

    def current_rules(self) -> list[Data]:
        rules = self._search()[0]
        self.status = rules
        return rules

    def new_law_rules(self) -> list[Data]:
        return self._search()[1]
