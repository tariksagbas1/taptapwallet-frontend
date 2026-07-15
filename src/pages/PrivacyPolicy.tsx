import { LegalPageLayout } from "@/components/LegalPageLayout";

const PrivacyPolicy = () => (
  <LegalPageLayout title="Gizlilik Politikası">
    <p>
      Bu politika, WalletCo sadakat kartı hizmeti kapsamında hangi kişisel verilerin toplandığını,
      nasıl kullanıldığını ve nasıl korunduğunu açıklar. 6698 sayılı Kişisel Verilerin Korunması
      Kanunu (&quot;KVKK&quot;) kapsamında hazırlanmıştır.
    </p>

    <h2>1. Veri sorumlusu</h2>
    <p>
      WalletCo hizmeti kapsamında kişisel verileriniz, hizmeti sunan tarafça veri sorumlusu sıfatıyla
      işlenmektedir. İletişim:{" "}
      <a href="mailto:destek@walletco.app" className="text-primary hover:underline">
        destek@walletco.app
      </a>
    </p>

    <h2>2. Toplanan veriler</h2>
    <h3>İşletmeler (kafe, restoran vb.)</h3>
    <ul>
      <li>E-posta adresi ve şifre (hesap girişi)</li>
      <li>İşletmenin resmi / ticari unvanı</li>
      <li>Sadakat programı ve kart kullanımına ilişkin işlem kayıtları</li>
    </ul>
    <h3>Müşteriler (sadakat kartı sahipleri)</h3>
    <ul>
      <li>Ad ve soyad</li>
      <li>Telefon numarası</li>
      <li>Sadakat kartı kullanım verileri (damga basımı, ödül kullanımı, katılım tarihi)</li>
    </ul>
    <h3>Mobil uygulama</h3>
    <p>
      Mobil uygulama yalnızca QR kod tarama işlevi sunar; uygulama üzerinden hesap oluşturulmaz ve
      ek kişisel veri toplanmaz.
    </p>

    <h2>3. Verilerin kullanım amacı</h2>
    <ul>
      <li>Sadakat kartı hizmetinin sunulması ve işletmenin programını yönetmesi</li>
      <li>Damga basımı, ödül takibi ve kart güncellemelerinin gerçekleştirilmesi</li>
      <li>İşletmeye yönelik istatistikler (üye sayısı, damga/ödül kullanımı, ziyaret sıklığı vb.)</li>
      <li>Hesap güvenliği ve teknik destek</li>
    </ul>
    <p>
      Telefon numarası ve diğer kişisel veriler reklam, pazarlama veya üçüncü taraflara satış
      amacıyla kullanılmaz.
    </p>

    <h2>4. Verilerin saklanması ve güvenliği</h2>
    <p>
      Tüm veriler şifreli bağlantılar üzerinden iletilir ve güvenli altyapıda saklanır. Şifreler
      güvenli yöntemlerle korunur; düz metin olarak tutulmaz.
    </p>

    <h2>5. Verilerin paylaşımı</h2>
    <p>
      Müşteri verileri yalnızca ilgili işletmeye (sadakat programını yürüten tarafa) sunulur.
      Yasal zorunluluk dışında üçüncü taraflarla paylaşılmaz. Hizmet altyapısı için güvenilir
      barındırma sağlayıcıları kullanılabilir.
    </p>

    <h2>6. Saklama süresi</h2>
    <p>
      Veriler, hizmet ilişkisi sürdüğü müddetçe ve yasal yükümlülüklerin gerektirdiği süre boyunca
      saklanır. Hesap kapatıldığında veya talep üzerine makul süre içinde silinir veya anonimleştirilir.
    </p>

    <h2>7. Haklarınız</h2>
    <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
    <ul>
      <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
      <li>İşlenmişse bilgi talep etme</li>
      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
      <li>Silinmesini veya yok edilmesini talep etme</li>
    </ul>
    <p>
      Taleplerinizi{" "}
      <a href="mailto:destek@walletco.app" className="text-primary hover:underline">
        destek@walletco.app
      </a>{" "}
      adresine iletebilirsiniz.
    </p>

    <h2>8. Çerezler</h2>
    <p>
      Web sitesi, oturum yönetimi ve hizmetin çalışması için gerekli teknik çerezler kullanabilir.
      Reklam veya izleme amaçlı çerez kullanılmaz.
    </p>

    <h2>9. Değişiklikler</h2>
    <p>
      Bu politika güncellenebilir. Güncel metin her zaman web sitesinde yayımlanır.
    </p>
  </LegalPageLayout>
);

export default PrivacyPolicy;
