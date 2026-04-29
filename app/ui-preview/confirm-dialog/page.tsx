'use client';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Group, Section } from '../_components/Showcase';

type ConfirmKey =
  | 'danger'
  | 'warning'
  | 'info'
  | 'success'
  | 'question'
  | 'async'
  | 'no-cancel';

export default function ConfirmDialogPreviewPage() {
  const [openKey, setOpenKey] = useState<ConfirmKey | null>(null);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const open = (key: ConfirmKey) => setOpenKey(key);
  const close = () => setOpenKey(null);

  const handleAsyncConfirm = async () => {
    setAsyncLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAsyncLoading(false);
    close();
  };

  return (
    <>
      <Section
        title="نوافذ التأكيد · Confirm Dialog"
        subtitle="نافذة مركّزة لتأكيد الإجراءات قبل تنفيذها — مع أيقونة وألوان حسب النوع"
      >
        <Group label="Danger" description="للإجراءات المدمّرة كالحذف">
          <Button variant="danger" startIcon={<Trash2 size={16} />} onClick={() => open('danger')}>
            حذف الحساب
          </Button>
        </Group>

        <Group label="Warning" description="لإجراءات تتطلب الانتباه">
          <Button variant="outline" onClick={() => open('warning')}>
            تنبيه قبل المتابعة
          </Button>
        </Group>

        <Group label="Info" description="لتأكيدات معلوماتية">
          <Button variant="outline" onClick={() => open('info')}>
            معلومة مهمة
          </Button>
        </Group>

        <Group label="Success" description="لتأكيد نجاح إجراء">
          <Button variant="outline" onClick={() => open('success')}>
            تم بنجاح
          </Button>
        </Group>

        <Group label="Question (Default)" description="السؤال العام — اللون الأساسي للنظام">
          <Button onClick={() => open('question')}>تأكيد عام</Button>
        </Group>

        <Group
          label="Async Confirm"
          description="يعرض حالة تحميل تلقائياً أثناء انتظار onConfirm"
        >
          <Button onClick={() => open('async')}>تأكيد غير متزامن</Button>
        </Group>

        <Group label="Without Cancel" description="زر تأكيد فقط">
          <Button variant="outline" onClick={() => open('no-cancel')}>
            إقرار فقط
          </Button>
        </Group>
      </Section>

      <ConfirmDialog
        open={openKey === 'danger'}
        onClose={close}
        onConfirm={close}
        variant="danger"
        title="حذف الحساب نهائياً؟"
        description="سيتم حذف جميع بياناتك ومعاملاتك. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف الحساب"
        cancelLabel="إلغاء"
      />

      <ConfirmDialog
        open={openKey === 'warning'}
        onClose={close}
        onConfirm={close}
        variant="warning"
        title="هل أنت متأكد؟"
        description="ستفقد التغييرات غير المحفوظة عند المتابعة."
        confirmLabel="متابعة"
      />

      <ConfirmDialog
        open={openKey === 'info'}
        onClose={close}
        onConfirm={close}
        variant="info"
        title="ميزة جديدة متاحة"
        description="يمكنك الآن ربط أكثر من حساب مصرفي وعرضها في لوحة موحدة."
        confirmLabel="فهمت"
        cancelLabel="لاحقاً"
      />

      <ConfirmDialog
        open={openKey === 'success'}
        onClose={close}
        onConfirm={close}
        variant="success"
        title="تم تحقيق هدفك!"
        description="تهانينا — وصلت إلى هدف ادخار 5,000 ر.س قبل الموعد المحدد."
        confirmLabel="رائع"
        hideCancel
      />

      <ConfirmDialog
        open={openKey === 'question'}
        onClose={close}
        onConfirm={close}
        variant="question"
        title="تفعيل الإشعارات الذكية؟"
        description="سنرسل لك تنبيهات عند الاقتراب من حدود الإنفاق الشهري."
        confirmLabel="تفعيل"
        cancelLabel="ليس الآن"
      />

      <ConfirmDialog
        open={openKey === 'async'}
        onClose={close}
        onConfirm={handleAsyncConfirm}
        loading={asyncLoading}
        variant="question"
        title="حفظ الإعدادات؟"
        description="جرّب الضغط على «حفظ» — ستظهر حالة تحميل لمدة ١.٥ ثانية."
        confirmLabel="حفظ"
      />

      <ConfirmDialog
        open={openKey === 'no-cancel'}
        onClose={close}
        onConfirm={close}
        variant="info"
        title="تم تحديث الشروط"
        description="يجب الإقرار بالشروط الجديدة لمتابعة استخدام الخدمة."
        confirmLabel="أقر وأوافق"
        hideCancel
      />
    </>
  );
}
