import { Link } from "react-router-dom";
import { LegalPageLayout } from "@/components/LegalPageLayout";

const Support = () => (
  <LegalPageLayout title="Destek">
    <p>
      WalletCo ile ilgili sorularınız, teknik problemleriniz veya geri bildirimleriniz için bizimle
      iletişime geçebilirsiniz.
    </p>

    <h2>İletişim</h2>
    <p>
      E-posta:{" "}
      <a href="mailto:destek@walletco.app" className="text-primary hover:underline">
        destek@walletco.app
      </a>
    </p>
    <p>Mesajlarınıza genellikle 1–2 iş günü içinde yanıt verilir.</p>

    <h2>Ne zaman yazmalısınız?</h2>
    <ul>
      <li>Hesabınız veya giriş ile ilgili sorunlar</li>
      <li>Uygulama veya web sitesi hataları</li>
      <li>Veri talepleri ve gizlilik soruları</li>
      <li>Genel sorular ve öneriler</li>
    </ul>

    <p>
      Gizlilik ve kullanım koşulları için{" "}
      <Link to="/privacy-policy" className="text-primary hover:underline">
        Gizlilik Politikası
      </Link>{" "}
      ve{" "}
      <Link to="/user-agreement" className="text-primary hover:underline">
        Kullanıcı Sözleşmesi
      </Link>{" "}
      sayfalarına göz atabilirsiniz.
    </p>
  </LegalPageLayout>
);

export default Support;
