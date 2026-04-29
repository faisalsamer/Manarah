'use client';

import { Button, ButtonGroup, IconButton } from '@/components/ui/Button';
import {
  Bell,
  Building2,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { Section, Group } from './_components/Showcase';

export default function UIPreviewButtonsPage() {
  return (
    <>
      <Section title="الأزرار · Buttons" subtitle="الأشكال والأحجام والحالات المختلفة">
        <Group label="Primary">
          <Button startIcon={<Plus size={16} />}>إضافة عملية</Button>
          <Button>حفظ التغييرات</Button>
          <Button startIcon={<Sparkles size={16} />}>ترقية الخطة</Button>
          <Button endIcon={<ArrowLeft size={16} />}>التالي</Button>
        </Group>

        <Group label="Outline">
          <Button variant="outline" startIcon={<Building2 size={16} />}>
            ربط حساب مصرفي جديد
          </Button>
          <Button variant="outline">إلغاء</Button>
          <Button variant="outline" startIcon={<Download size={16} />}>
            تصدير
          </Button>
        </Group>

        <Group label="Ghost">
          <Button variant="ghost">عرض المزيد</Button>
          <Button variant="ghost" startIcon={<Settings size={16} />}>
            الإعدادات
          </Button>
        </Group>

        <Group label="Danger">
          <Button variant="danger" startIcon={<Trash2 size={16} />}>
            حذف الحساب
          </Button>
          <Button variant="danger">تأكيد الحذف</Button>
        </Group>

        <Group label="Link">
          <Button variant="link">عرض التفاصيل</Button>
          <Button variant="link" endIcon={<ArrowLeft size={14} />}>
            عرض الكل
          </Button>
        </Group>

        <Group label="Sizes">
          <Button size="sm">صغير</Button>
          <Button size="md">متوسط</Button>
          <Button size="lg">كبير</Button>
        </Group>

        <Group label="States">
          <Button loading>جارٍ الحفظ</Button>
          <Button disabled>معطّل</Button>
          <Button variant="outline" loading>
            تحميل
          </Button>
          <Button variant="outline" disabled>
            معطّل
          </Button>
        </Group>

        <Group label="Full Width">
          <div className="w-full max-w-md">
            <Button fullWidth startIcon={<Plus size={16} />}>
              إضافة معاملة جديدة
            </Button>
          </div>
        </Group>

        <Group label="Button Group">
          <ButtonGroup>
            <Button variant="ghost">إلغاء</Button>
            <Button>تأكيد</Button>
          </ButtonGroup>
        </Group>
      </Section>

      <Section title="أزرار الأيقونات · Icon Buttons" subtitle="للإجراءات المختصرة">
        <Group label="Variants">
          <IconButton icon={<Bell size={18} />} ariaLabel="الإشعارات" variant="subtle" />
          <IconButton icon={<Settings size={18} />} ariaLabel="الإعدادات" variant="subtle" />
          <IconButton icon={<Plus size={18} />} ariaLabel="إضافة" variant="primary" />
          <IconButton icon={<Plus size={18} />} ariaLabel="إضافة" variant="outline" />
          <IconButton icon={<Settings size={18} />} ariaLabel="الإعدادات" variant="ghost" />
          <IconButton icon={<Trash2 size={18} />} ariaLabel="حذف" variant="danger" />
        </Group>

        <Group label="Sizes">
          <IconButton size="sm" icon={<Bell size={14} />} ariaLabel="الإشعارات" />
          <IconButton size="md" icon={<Bell size={18} />} ariaLabel="الإشعارات" />
          <IconButton size="lg" icon={<Bell size={20} />} ariaLabel="الإشعارات" />
        </Group>

        <Group label="States">
          <IconButton icon={<Plus size={18} />} ariaLabel="إضافة" variant="primary" loading />
          <IconButton icon={<Plus size={18} />} ariaLabel="إضافة" variant="primary" disabled />
        </Group>
      </Section>
    </>
  );
}
