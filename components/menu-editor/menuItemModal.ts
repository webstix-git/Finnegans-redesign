import type { EditableMenuItem } from '@/lib/menuItems';
import type { FormField } from '@/components/editor/formModal';
import { showFormModal } from '@/components/editor/formModal';

function itemTitle(item: EditableMenuItem, isNew = false): string {
  if (isNew) {
    if (item.category === 'salad') return 'Add Salad Option';
    if (item.category === 'drafts') return 'Add Draft Beer';
    if (item.category === 'mains') return 'Add Main';
    return 'Add Appetizer';
  }
  if (item.isSaladDescription) return 'Edit Salad Description';
  if (item.isDraftFooter) return item.name;
  if (item.category === 'salad') return 'Edit Salad Option';
  if (item.category === 'drafts') return 'Edit Draft Beer';
  if (item.category === 'mains') return 'Edit Main';
  return 'Edit Appetizer';
}

function itemSubtitle(item: EditableMenuItem, isNew = false): string {
  if (isNew) return 'Fill in the details for the new menu item.';
  if (item.isSaladDescription || item.isDraftFooter) {
    return 'Update the text shown on the menu.';
  }
  if (item.category === 'salad' || item.category === 'drafts') {
    return 'Update this menu line item.';
  }
  return 'Edit name, description, price, and badge for this item.';
}

function fieldsForItem(item: EditableMenuItem): FormField[] {
  if (item.isSaladDescription) {
    return [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        value: item.description,
        placeholder: 'Salad section description',
      },
    ];
  }

  if (item.isDraftFooter) {
    return [
      {
        name: 'description',
        label: 'Text',
        type: 'textarea',
        value: item.description,
        placeholder: 'Promotional text',
      },
    ];
  }

  if (item.category === 'salad') {
    return [
      { name: 'name', label: 'Name', type: 'text', value: item.name, placeholder: 'Option name' },
      { name: 'price', label: 'Price', type: 'text', value: item.price, placeholder: '$12' },
    ];
  }

  if (item.category === 'drafts') {
    return [
      { name: 'name', label: 'Beer Name', type: 'text', value: item.name, placeholder: 'Beer name' },
      { name: 'price', label: 'Price', type: 'text', value: item.price, placeholder: '$6' },
    ];
  }

  return [
    { name: 'name', label: 'Name', type: 'text', value: item.name, placeholder: 'Item name' },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      value: item.description,
      placeholder: 'Optional description',
    },
    { name: 'price', label: 'Price', type: 'text', value: item.price, placeholder: '$12' },
    {
      name: 'badge',
      label: 'Badge',
      type: 'text',
      value: item.badge,
      placeholder: 'Optional badge (e.g. New)',
    },
  ];
}

function valuesToItem(item: EditableMenuItem, values: Record<string, string>): EditableMenuItem {
  if (item.isSaladDescription || item.isDraftFooter) {
    return { ...item, description: values.description?.trim() ?? '' };
  }

  if (item.category === 'salad') {
    return {
      ...item,
      name: values.name?.trim() ?? '',
      price: values.price?.trim() ?? '',
    };
  }

  if (item.category === 'drafts') {
    return {
      ...item,
      name: values.name?.trim() ?? '',
      price: values.price?.trim() ?? '',
    };
  }

  return {
    ...item,
    name: values.name?.trim() ?? '',
    description: values.description?.trim() ?? '',
    price: values.price?.trim() ?? '',
    badge: values.badge?.trim() ?? '',
  };
}

export async function showMenuItemModal(
  item: EditableMenuItem,
  options?: { isNew?: boolean }
): Promise<{ action: 'save' | 'cancel' | 'delete'; item?: EditableMenuItem }> {
  const isNew = options?.isNew ?? false;
  const canDelete = !isNew && !item.isSaladDescription && !item.isDraftFooter;

  const result = await showFormModal({
    title: itemTitle(item, isNew),
    subtitle: itemSubtitle(item, isNew),
    fields: fieldsForItem(item),
    allowDelete: canDelete,
    deleteLabel: 'Delete Item',
  });

  if (result.action === 'save' && result.values) {
    return { action: 'save', item: valuesToItem(item, result.values) };
  }

  if (result.action === 'delete') {
    return { action: 'delete' };
  }

  return { action: 'cancel' };
}
