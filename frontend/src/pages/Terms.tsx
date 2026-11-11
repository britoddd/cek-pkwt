import { TTL_MINUTES } from '../storage'

// Plain-language terms. They describe what CekPKWT does and does not stand behind, instead of waiving
// responsibility: a clause shifting the operator's responsibility to the user can be void
// (UU 8/1999 Pasal 18), and an electronic system's operator stays responsible for running it
// reliably (UU ITE Pasal 15 and 21).
export default function Terms() {
  return (
    <div className="container page">
      <div className="stack-sm" style={{ gap: 6 }}>
        <h1 className="h1 balance" tabIndex={-1}>Syarat penggunaan</h1>
        <p className="muted measure">Berlaku untuk web app CekPKWT dan tool CekPKWT di IBM Bob. Terakhir diperbarui 11 November 2026.</p>
      </div>

      <div className="card card-raised stack-lg measure">
        <section className="stack-sm">
          <h2 className="card-title">Apa itu CekPKWT</h2>
          <p>CekPKWT memberi <strong>informasi hukum</strong>: membandingkan klausul kontrak PKWT dengan pasal dari basis regulasi resmi kami. CekPKWT <strong>bukan nasihat hukum</strong> dan bukan jasa advokat. CekPKWT tidak mewakili siapa pun dan tidak menilai apakah sebuah kontrak sah atau batal.</p>
        </section>

        <section className="stack-sm">
          <h2 className="card-title">Yang menjadi tanggung jawab kami</h2>
          <ul className="stack-sm">
            <li>Menjaga basis regulasi tetap akurat: setiap pasal bersumber dari dokumen resmi, dan setiap perubahan ditinjau manusia sebelum dipakai.</li>
            <li>Memastikan setiap temuan menunjuk ke pasal yang ada di basis regulasi, dan menyatakan "tidak dapat diperiksa" jika pasalnya tidak ada.</li>
            <li>Menjalankan layanan seandal yang kami bisa, mengukur akurasinya secara terbuka, dan memperbaiki kesalahan yang dilaporkan.</li>
            <li>Melindungi datamu: data pribadi disamarkan sebelum dibaca AI, dan teks kontrak tidak disimpan di server kami.</li>
          </ul>
        </section>

        <section className="stack-sm">
          <h2 className="card-title">Yang tetap di tanganmu</h2>
          <ul className="stack-sm">
            <li>Keputusan menandatangani, menegosiasikan, atau menolak kontrak.</li>
            <li>Memberikan teks kontrak yang lengkap. Klausul yang tidak ditempel tidak bisa diperiksa.</li>
            <li>Mengecek pasal rujukan di tautan teks resminya, dan mengonfirmasi temuan ke HR sebelum bertindak.</li>
          </ul>
        </section>

        <section className="stack-sm">
          <h2 className="card-title">Kapan harus ke LBH atau Disnaker</h2>
          <p>AI bisa keliru: melewatkan masalah, atau menandai masalah yang sebenarnya tidak ada. Jika temuan berkeparahan tinggi, jika kamu akan menolak kontrak karenanya, atau jika sudah ada sengketa, mintalah pendampingan dari LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.</p>
        </section>

        <section className="stack-sm">
          <h2 className="card-title">Datamu</h2>
          <p>NIK, NPWP, email, telepon, nomor rekening, nama, alamat, dan tempat/tanggal lahir disamarkan sebelum teks dikirim ke model AI. PDF dibaca di browsermu dan tidak diunggah. Laporan disimpan di browser ini selama {TTL_MINUTES} menit, lalu terhapus. Teks yang sudah disamarkan diproses oleh penyedia model AI kami (OpenAI) untuk membuat laporan. Kami mengaktifkan berbagi data dengan OpenAI, sehingga teks yang sudah disamarkan itu dapat dipakai OpenAI untuk meningkatkan modelnya.</p>
        </section>

        <section className="stack-sm">
          <h2 className="card-title">Melaporkan kesalahan</h2>
          <p>Setiap temuan punya tautan "Laporkan kesalahan". Laporan itu publik, jadi jangan sertakan isi kontrak atau data pribadi. Kesalahan yang terbukti kami perbaiki di basis regulasi atau di instruksi AI.</p>
        </section>
      </div>
    </div>
  )
}
