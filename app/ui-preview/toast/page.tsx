'use client';

import { Button } from '@/components/ui/Button';
import {
  Toaster,
  dismissAllToasts,
  toast,
  type ToastPosition,
} from '@/components/ui/Toast';
import { useState } from 'react';
import { Group, Section } from '../_components/Showcase';

const positions: { value: ToastPosition; label: string }[] = [
  { value: 'top-right', label: 'أعلى يمين' },
  { value: 'top-center', label: 'أعلى وسط' },
  { value: 'top-left', label: 'أعلى يسار' },
  { value: 'bottom-right', label: 'أسفل يمين' },
  { value: 'bottom-center', label: 'أسفل وسط' },
  { value: 'bottom-left', label: 'أسفل يسار' },
];

export default function ToastPreviewPage() {
  const [position, setPosition] = useState<ToastPosition>('bottom-left');

  return (
    <>
      <Section
        title="الإشعارات · Toast"
        subtitle="رسائل قصيرة لإعطاء المستخدم تغذية راجعة فورية — تظهر وتختفي تلقائياً"
      >
        <Group label="Variants" description="نجاح · خطأ · تحذير · معلومة">
          <Button
            onClick={() =>
              toast.success('تم الحفظ', 'تم تحديث بياناتك بنجاح')
            }
          >
            نجاح
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              toast.error('فشلت العملية', 'تعذّر الاتصال بالخادم. حاول مرة أخرى.')
            }
          >
            خطأ
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.warning('تنبيه', 'اقترب رصيدك من حد الإنفاق الشهري.')
            }
          >
            تحذير
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.info('معلومة', 'تم تفعيل المزامنة التلقائية لحساباتك.')
            }
          >
            معلومة
          </Button>
        </Group>

        <Group label="Title Only" description="بدون وصف — للرسائل المختصرة">
          <Button
            variant="outline"
            onClick={() => toast.success('تم النسخ')}
          >
            عرض
          </Button>
        </Group>

        <Group
          label="With Action"
          description="زر إجراء داخل الإشعار — مثل تراجع أو إعادة محاولة"
        >
          <Button
            onClick={() =>
              toast({
                title: 'تم حذف المعاملة',
                description: 'يمكنك التراجع خلال ٥ ثوانٍ',
                variant: 'success',
                duration: 5000,
                action: {
                  label: 'تراجع',
                  onClick: () => toast.info('تم التراجع'),
                },
              })
            }
          >
            حذف مع تراجع
          </Button>
        </Group>

        <Group label="Custom Duration" description="duration بالميلي ثانية — صفر أو سالب = دائم">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'إشعار سريع',
                description: 'يختفي بعد ثانيتين',
                variant: 'info',
                duration: 2000,
              })
            }
          >
            ٢ ثانية
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'إشعار طويل',
                description: 'يبقى ١٠ ثوانٍ',
                variant: 'info',
                duration: 10000,
              })
            }
          >
            ١٠ ثوانٍ
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'إشعار دائم',
                description: 'لا يختفي تلقائياً — أغلقه يدوياً',
                variant: 'warning',
                duration: 0,
              })
            }
          >
            دائم
          </Button>
        </Group>

        <Group label="Stacking" description="عدة إشعارات تُكدَّس بترتيب صحيح">
          <Button
            variant="outline"
            onClick={() => {
              toast.success('الأول');
              setTimeout(() => toast.info('الثاني'), 200);
              setTimeout(() => toast.warning('الثالث'), 400);
              setTimeout(() => toast.error('الرابع'), 600);
            }}
          >
            ٤ إشعارات
          </Button>
          <Button variant="ghost" onClick={() => dismissAllToasts()}>
            إغلاق الكل
          </Button>
        </Group>

        <Group
          label="Position"
          description="موقع <Toaster /> على الشاشة — جرّب التغيير ثم أطلق إشعاراً"
        >
          {positions.map((p) => (
            <Button
              key={p.value}
              variant={position === p.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPosition(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </Group>
      </Section>

      <Toaster position={position} />
    </>
  );
}
