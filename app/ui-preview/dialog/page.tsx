'use client';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogActions } from '@/components/ui/Dialog';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Group, Section } from '../_components/Showcase';

type DialogKey =
  | 'basic'
  | 'with-footer'
  | 'long-content'
  | 'no-close'
  | 'sm'
  | 'lg'
  | 'xl'
  | 'full'
  | 'custom';

export default function DialogPreviewPage() {
  const [openKey, setOpenKey] = useState<DialogKey | null>(null);
  const open = (key: DialogKey) => setOpenKey(key);
  const close = () => setOpenKey(null);

  return (
    <>
      <Section
        title="النوافذ المنبثقة · Dialog"
        subtitle="حاوية أساسية قابلة للتخصيص مع رأس وتذييل اختياريين وحركة انتقالية"
      >
        <Group label="Basic" description="عنوان ووصف ومحتوى — الأساس">
          <Button onClick={() => open('basic')}>فتح نافذة بسيطة</Button>
        </Group>

        <Group label="With Footer Actions" description="أزرار في التذييل وفاصل أعلى منها">
          <Button onClick={() => open('with-footer')}>فتح مع تذييل</Button>
        </Group>

        <Group label="Long Content (Scroll)" description="محتوى طويل قابل للتمرير داخلياً">
          <Button onClick={() => open('long-content')}>فتح بمحتوى طويل</Button>
        </Group>

        <Group
          label="No Close Button"
          description="إخفاء زر الإغلاق مع تعطيل الإغلاق بالنقر خارجياً وزر Escape"
        >
          <Button variant="outline" onClick={() => open('no-close')}>
            فتح بدون إغلاق
          </Button>
        </Group>

        <Group label="Sizes" description="sm · md (افتراضي) · lg · xl · full">
          <Button variant="outline" onClick={() => open('sm')}>
            صغير (sm)
          </Button>
          <Button variant="outline" onClick={() => open('lg')}>
            كبير (lg)
          </Button>
          <Button variant="outline" onClick={() => open('xl')}>
            كبير جداً (xl)
          </Button>
          <Button variant="outline" onClick={() => open('full')}>
            ملء الشاشة (full)
          </Button>
        </Group>

        <Group label="Custom Content" description="نموذج بسيط داخل النافذة">
          <Button startIcon={<Plus size={16} />} onClick={() => open('custom')}>
            إضافة هدف جديد
          </Button>
        </Group>
      </Section>

      {/* ──── Dialogs ──── */}
      <Dialog
        open={openKey === 'basic'}
        onClose={close}
        title="مرحباً بك في منار"
        description="هذه نافذة منبثقة بسيطة تحتوي على عنوان ووصف ومحتوى."
      >
        <p>
          يمكنك إغلاق النافذة بالضغط على زر الإغلاق، أو بالنقر خارج الإطار، أو بالضغط على
          مفتاح Escape.
        </p>
      </Dialog>

      <Dialog
        open={openKey === 'with-footer'}
        onClose={close}
        title="حفظ التغييرات؟"
        description="ستُطبَّق التغييرات فوراً على حسابك."
        footer={
          <DialogActions>
            <Button variant="ghost" onClick={close}>
              إلغاء
            </Button>
            <Button onClick={close}>حفظ</Button>
          </DialogActions>
        }
      >
        <p>قمت بتعديل عدة حقول. هل ترغب في حفظ التغييرات الآن؟</p>
      </Dialog>

      <Dialog
        open={openKey === 'long-content'}
        onClose={close}
        title="شروط الاستخدام"
        description="اقرأ الشروط بعناية قبل المتابعة"
        footer={
          <DialogActions>
            <Button variant="ghost" onClick={close}>
              إغلاق
            </Button>
            <Button onClick={close}>قبول</Button>
          </DialogActions>
        }
      >
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <p key={i}>
              فقرة رقم {i + 1}: هذا نص توضيحي يهدف إلى عرض سلوك التمرير الداخلي عندما
              يتجاوز المحتوى ارتفاع النافذة. يبقى الرأس والتذييل ثابتين بينما يتمرر المحتوى
              في المنتصف.
            </p>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={openKey === 'no-close'}
        onClose={close}
        title="إجراء مطلوب"
        description="يجب اتخاذ قرار للمتابعة"
        showCloseButton={false}
        closeOnOverlayClick={false}
        closeOnEscape={false}
        footer={
          <DialogActions>
            <Button onClick={close}>متابعة</Button>
          </DialogActions>
        }
      >
        <p>لا يمكن إغلاق هذه النافذة إلا بالضغط على زر المتابعة.</p>
      </Dialog>

      <Dialog open={openKey === 'sm'} onClose={close} size="sm" title="نافذة صغيرة">
        <p>عرض أقصى 384px — مناسب للرسائل القصيرة.</p>
      </Dialog>

      <Dialog open={openKey === 'lg'} onClose={close} size="lg" title="نافذة كبيرة">
        <p>عرض أقصى 512px — للمحتوى الأكثر تفصيلاً.</p>
      </Dialog>

      <Dialog open={openKey === 'xl'} onClose={close} size="xl" title="نافذة كبيرة جداً">
        <p>عرض أقصى 672px — للنماذج الطويلة أو الجداول.</p>
      </Dialog>

      <Dialog
        open={openKey === 'full'}
        onClose={close}
        size="full"
        title="نافذة بملء الشاشة"
        description="مناسبة لمحررات أو لوحات تحكم داخلية"
      >
        <p>تأخذ هذه النافذة أقصى عرض حتى 1100px أو 92% من عرض الشاشة.</p>
      </Dialog>

      <Dialog
        open={openKey === 'custom'}
        onClose={close}
        title="هدف ادخار جديد"
        description="حدد المبلغ والتاريخ المستهدف"
        footer={
          <DialogActions>
            <Button variant="ghost" onClick={close}>
              إلغاء
            </Button>
            <Button onClick={close}>إنشاء الهدف</Button>
          </DialogActions>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[var(--text-body-sm)] font-semibold text-[var(--color-text-primary)] mb-1.5">
              اسم الهدف
            </span>
            <input
              type="text"
              defaultValue="رحلة صيف"
              className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--text-body)] focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-3 focus:ring-[rgba(0,196,140,0.12)]"
            />
          </label>
          <label className="block">
            <span className="block text-[var(--text-body-sm)] font-semibold text-[var(--color-text-primary)] mb-1.5">
              المبلغ المستهدف (ر.س)
            </span>
            <input
              type="number"
              defaultValue={5000}
              className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--text-body)] focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-3 focus:ring-[rgba(0,196,140,0.12)]"
            />
          </label>
        </div>
      </Dialog>
    </>
  );
}
