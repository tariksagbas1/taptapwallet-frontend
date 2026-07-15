import { LegalPageLayout } from "@/components/LegalPageLayout";

const UserAgreement = () => (
  <LegalPageLayout title="Kullanıcı Sözleşmesi">
    <p>
      Bu sözleşme, WalletCo adlı sadakat kartı hizmetini (&quot;Hizmet&quot;) kullanan işletmeler ve
      ilgili personel için geçerlidir. Hizmeti kullanarak bu koşulları kabul etmiş sayılırsınız.
    </p>

    <h2>1. Hizmetin tanımı</h2>
    <p>
      WalletCo; kafe, restoran ve benzeri işletmelerin müşterilerine Apple Wallet üzerinden dijital
      sadakat kartı sunmasını sağlayan bir platformdur. İşletmeler web paneli üzerinden hesap
      oluşturur, sadakat programlarını belirler ve müşteri verilerini yönetir. Mobil uygulama yalnızca
      işletme personelinin müşteri kartlarındaki QR kodu okutarak damga basması amacıyla kullanılır.
    </p>

    <h2>2. Hesap ve kullanım</h2>
    <ul>
      <li>İşletme hesapları web sitesi üzerinden oluşturulur; mobil uygulamada hesap oluşturma yoktur.</li>
      <li>Hesap bilgilerinizin gizliliğinden ve hesabınız üzerinden yapılan işlemlerden siz sorumlusunuz.</li>
      <li>Hizmeti yalnızca yasalara ve iyi niyet kurallarına uygun şekilde kullanmalısınız.</li>
      <li>Sadakat programı koşullarını (damga sayısı, ödül türü vb.) işletme olarak siz belirlersiniz.</li>
    </ul>

    <h2>3. Müşteriler</h2>
    <p>
      Son müşteriler, işletmenizin QR kodunu okutarak sadakat kartını Apple Wallet&apos;a ekler. Kart
      kullanımı ve ödül koşulları işletmeniz ile müşteri arasındaki ilişkiye tabidir; WalletCo bu
      ilişkinin tarafı değildir.
    </p>

    <h2>4. Hizmet değişiklikleri</h2>
    <p>
      WalletCo, hizmeti geliştirmek veya yasal yükümlülüklere uymak amacıyla özellikleri
      güncelleyebilir veya değiştirebilir. Önemli değişiklikler web sitesi üzerinden duyurulur.
    </p>

    <h2>5. Sorumluluk sınırı</h2>
    <p>
      Hizmet &quot;olduğu gibi&quot; sunulur. WalletCo, işletmeniz ile müşterileriniz arasındaki
      ticari ilişkiden, ödül uygulamalarından veya hizmetin geçici olarak kullanılamamasından
      doğan dolaylı zararlardan sorumlu tutulamaz.
    </p>

    <h2>6. Fesih</h2>
    <p>
      Hesabınızı istediğiniz zaman kapatabilir veya bizimle iletişime geçerek hesabınızın
      sonlandırılmasını talep edebilirsiniz. Kötüye kullanım durumunda hesabınız askıya alınabilir.
    </p>

    <h2>7. Uygulanacak hukuk</h2>
    <p>
      Bu sözleşme Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıklarda İstanbul (Çağlayan)
      mahkemeleri ve icra daireleri yetkilidir.
    </p>

    <h2>8. İletişim</h2>
    <p>
      Sorularınız için:{" "}
      <a href="mailto:destek@walletco.app" className="text-primary hover:underline">
        destek@walletco.app
      </a>
    </p>
  </LegalPageLayout>
);

export default UserAgreement;
