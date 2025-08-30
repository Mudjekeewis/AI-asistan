import { Fragment } from 'react';
import {
  Building2,
  Users,
  Phone,
  Settings,
  Calendar,
  MessageSquare,
  BarChart3,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IOptionsItems, Options } from './components';

export function CrmGetStartedContent() {
  const items: IOptionsItems = [
    {
      icon: Building2,
      title: 'Projeler',
      desc: 'Proje bilgilerini yönetin ve AI asistanın kullanacağı içerikleri hazırlayın.',
      path: '/crm/projects',
    },
    {
      icon: Users,
      title: 'Lead\'ler',
      desc: 'Müşteri adaylarını yönetin ve WebRTC ile AI görüşmeleri başlatın.',
      path: '/crm/leads',
    },
    {
      icon: Phone,
      title: 'Görüşmeler',
      desc: 'AI destekli görüşme geçmişini ve transkriptleri inceleyin.',
      path: '/crm/calls',
    },
    {
      icon: Calendar,
      title: 'Randevular',
      desc: 'Müşteri randevularını planlayın ve takip edin.',
      path: '/crm/appointments',
    },
    {
      icon: MessageSquare,
      title: 'Mesajlar',
      desc: 'WhatsApp, SMS ve email mesajlarını yönetin.',
      path: '/crm/messages',
    },
    {
      icon: BarChart3,
      title: 'Raporlar',
      desc: 'Satış performansı ve müşteri analizlerini görüntüleyin.',
      path: '/crm/reports',
    },
    {
      icon: Settings,
      title: 'Ayarlar',
      desc: 'OpenAI API ayarları ve sistem konfigürasyonu.',
      path: '/crm/settings',
    },
    {
      icon: FileText,
      title: 'Dokümantasyon',
      desc: 'API dokümantasyonu ve kullanım kılavuzları.',
      path: '/crm/docs',
    },
  ];

  return (
    <Fragment>
      <Options items={items} dropdown={true} />
      <div className="flex grow justify-center pt-5 lg:pt-7.5">
        <Button mode="link" underlined="dashed" asChild>
          <Link to="/crm/projects">Tüm CRM Modülleri</Link>
        </Button>
      </div>
    </Fragment>
  );
}
