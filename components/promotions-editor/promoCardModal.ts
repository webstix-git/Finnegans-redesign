import type { EditablePromoField, PromoCardId } from '@/lib/promotionItems';
import type { FormField } from '@/components/editor/formModal';
import { showFormModal } from '@/components/editor/formModal';

const CARD_TITLES: Record<PromoCardId, string> = {
  'every-day': 'Edit Every Day Special',
  'alumni-hour': 'Edit Alumni Hour',
  tuesday: 'Edit Tuesday',
  wednesday: 'Edit Wednesday',
  thursday: 'Edit Thursday',
  friday: 'Edit Friday',
  saturday: 'Edit Saturday',
  sunday: 'Edit Sunday',
};

const FIELD_LABELS: Record<string, string> = {
  day: 'Day Label',
  title: 'Title',
  badge: 'Badge',
  priceLine: 'Price Line',
  description: 'Description',
  displayPrice: 'Display Price',
  segmentText: 'Content',
  listItem: 'List Item',
};

function fieldLabel(field: EditablePromoField, index: number): string {
  if (field.field === 'segmentText') return `Content ${index + 1}`;
  if (field.field === 'listItem') return `List Item ${(field.listIndex ?? 0) + 1}`;
  return FIELD_LABELS[field.field] ?? field.field;
}

function fieldName(field: EditablePromoField): string {
  if (field.field === 'segmentText') return `segment:${field.segmentId}`;
  if (field.field === 'listItem') return `list:${field.segmentId}:${field.listIndex}`;
  return field.field;
}

function fieldsFromPromo(original: EditablePromoField[]): FormField[] {
  let segmentCount = 0;
  return original.map((field) => {
    const label =
      field.field === 'segmentText'
        ? fieldLabel(field, segmentCount++)
        : fieldLabel(field, field.listIndex ?? 0);

    const isLong =
      field.field === 'description' ||
      (field.field === 'segmentText' && field.value.includes('\n'));

    return {
      name: fieldName(field),
      label,
      type: isLong ? 'textarea' : 'text',
      value: field.value,
    };
  });
}

function valuesToPromoFields(
  original: EditablePromoField[],
  values: Record<string, string>
): EditablePromoField[] {
  return original.map((field) => {
    const key = fieldName(field);
    return {
      ...field,
      value: values[key]?.trim() ?? '',
    };
  });
}

export async function showPromoCardModal(
  cardId: PromoCardId,
  originalFields: EditablePromoField[]
): Promise<{ action: 'save' | 'cancel'; fields?: EditablePromoField[] }> {
  const result = await showFormModal({
    title: CARD_TITLES[cardId],
    subtitle: 'Update all details for this promotion.',
    fields: fieldsFromPromo(originalFields),
    wide: true,
  });

  if (result.action === 'save' && result.values) {
    return {
      action: 'save',
      fields: valuesToPromoFields(originalFields, result.values),
    };
  }

  return { action: 'cancel' };
}
