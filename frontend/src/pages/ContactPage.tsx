import { Helmet } from 'react-helmet-async';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getWhatsAppUrl } from '../utils/helpers';

export default function ContactPage() {
  const { t } = useLanguage();
  const whatsappNumber = '+22247305955';

  return (
    <>
      <Helmet>
        <title>{t.contact.title} | WWenatou Shopping</title>
        <meta name="description" content={t.contact.title + ' - WWenatou Shopping'} />
      </Helmet>

      <div className="container-main py-8 md:py-16 min-h-[60vh]">
        <h1 className="section-title text-center mb-3">{t.contact.title}</h1>
        <p className="text-center text-brand-text-secondary mb-10 max-w-md mx-auto">
          {t.footer.about}
        </p>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* WhatsApp */}
          <a
            href={getWhatsAppUrl(whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-center p-8 border border-brand-border hover:border-primary transition-colors group"
          >
            <div className="w-14 h-14 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-sm font-semibold text-brand-text mb-1">{t.contact.whatsapp}</h3>
            <p className="text-sm text-brand-text-secondary">{whatsappNumber}</p>
          </a>

          {/* Phone */}
          <a
            href={`tel:${whatsappNumber}`}
            className="flex flex-col items-center text-center p-8 border border-brand-border hover:border-primary transition-colors group"
          >
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone size={24} />
            </div>
            <h3 className="text-sm font-semibold text-brand-text mb-1">{t.contact.phone}</h3>
            <p className="text-sm text-brand-text-secondary">{whatsappNumber}</p>
          </a>

          {/* Store Info */}
          <div className="flex flex-col items-center text-center p-8 border border-brand-border sm:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <MapPin size={24} />
            </div>
            <h3 className="text-sm font-semibold text-brand-text mb-1">{t.contact.storeInfo}</h3>
            <p className="text-sm text-brand-text-secondary">{t.checkout.deliveryInfo}</p>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-12 text-center">
          <a
            href={getWhatsAppUrl(whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t.contact.sendMessage}
          </a>
        </div>
      </div>
    </>
  );
}
