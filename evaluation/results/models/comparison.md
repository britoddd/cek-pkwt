| Model | Reports | Planted issues detected | ...with the correct article | False alarms on clean contracts | Clean reports without findings | Findings without citation | Citations found in corpus | Injection flagged, findings kept | Raw PII in reports | Median / p90 time |
|---|---|---|---|---|---|---|---|---|---|---|
| OpenAI:gpt-5.4-mini (production, 10 Nov) | 45 (0 failed) | 71/90 (79%) | 69/90 (77%) | 6 | 9/15 | 2/100 | 188/191 (98%) | 3/3 | 0 | 9.7 / 11.5 s |
| Google Generative AI:gemini-3.1-flash-lite | 45 (0 failed) | 83/90 (92%) | 83/90 (92%) | 3 | 12/15 | 0/97 | 131/142 (92%) | 2/3 | 0 | 6.9 / 9.8 s |
| Google Generative AI:gemini-3.8-flash | 18 (0 failed) | 28/30 (93%) | 28/30 (93%) | 0 | 10/10 | 0/30 | 47/47 (100%) | 0/1 | 0 | 47.2 / 78.9 s |

| Issue | OpenAI:gpt-5.4-mini (production, 10 Nov) | Google Generative AI:gemini-3.1-flash-lite | Google Generative AI:gemini-3.8-flash |
|---|---|---|---|
| bahasa_asing | 3/3 | 3/3 | 1/1 |
| cuti_kurang | 1/3 | 1/3 | 1/1 |
| denda_resign_berlebih | 9/9 | 9/9 | 3/3 |
| durasi_lebih_5_tahun | 2/6 | 6/6 | 2/2 |
| iuran_bpjs_dibebankan | 0/3 | 3/3 | 1/1 |
| jam_kerja_berlebih | 1/6 | 2/6 | 1/2 |
| kompensasi_ditiadakan | 6/6 | 6/6 | 2/2 |
| lembur_tanpa_upah | 6/6 | 6/6 | 2/2 |
| masa_percobaan | 12/12 | 12/12 | 4/4 |
| pekerjaan_tetap | 3/3 | 3/3 | 1/1 |
| penahanan_ijazah | 9/9 | 9/9 | 3/3 |
| potongan_upah_berlebih | 6/6 | 6/6 | 2/2 |
| tanpa_bpjs | 3/3 | 3/3 | 1/1 |
| thr_ditiadakan | 4/6 | 6/6 | 2/2 |
| upah_di_bawah_minimum | 6/9 | 8/9 | 2/3 |
