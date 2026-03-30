import type { FormFieldData } from '../lib/ai';

const extractFields = (): FormFieldData[] => {
  const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
  const data: FormFieldData[] = [];

  fields.forEach((el) => {
    // Only process visible elements
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') {
      return;
    }

    const id = el.id || '';
    const name = el.getAttribute('name') || '';
    const type = el.tagName.toLowerCase() === 'select' ? 'select' : el.getAttribute('type') || 'text';
    const placeholder = el.getAttribute('placeholder') || '';
    
    // Find associated label
    let labelText = el.getAttribute('aria-label') || '';
    if (!labelText && id) {
      const labelEl = document.querySelector(`label[for="${id}"]`);
      if (labelEl) labelText = labelEl.textContent?.trim() || '';
    }
    if (!labelText) {
      const parentLabel = el.closest('label');
      if (parentLabel) labelText = parentLabel.textContent?.replace(el.textContent || '', '').trim() || '';
    }

    let options: string[] | undefined;
    if (el.tagName.toLowerCase() === 'select') {
      options = Array.from((el as HTMLSelectElement).options).map(o => o.text);
    } else if (type === 'radio' || type === 'checkbox') {
      options = [el.getAttribute('value') || ''];
    }

    data.push({
      id: id || name || Math.random().toString(36).substr(2, 9),
      name,
      type,
      label: labelText,
      placeholder,
      value: (el as HTMLInputElement).value || '',
      options: options?.length ? options : undefined,
    });
    
    // Ensure the element has an ID for later injection
    if (!el.id) {
      el.id = data[data.length - 1].id;
    }
  });

  return data;
};

const fillInput = (id: string, value: string) => {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  if (!el) return;

  if (el.tagName.toLowerCase() === 'select') {
    const select = el as HTMLSelectElement;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].text.toLowerCase().includes(value.toLowerCase())) {
        select.selectedIndex = i;
        break;
      }
    }
  } else if (el.type === 'radio' || el.type === 'checkbox') {
    (el as HTMLInputElement).checked = true;
  } else {
    el.value = value;
  }
  
  // Trigger standard events so React/Vue sites register the change
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};

// Listen for messages from the sidebar / background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'EXTRACT_FIELDS') {
    const fields = extractFields();
    sendResponse({ fields });
  } else if (request.type === 'FILL_INPUT') {
    fillInput(request.id, request.value);
    sendResponse({ success: true });
  } else if (request.type === 'FILL_ALL') {
    const data = request.data; // Record<id, value>
    for (const [id, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        fillInput(id, value);
      }
    }
    sendResponse({ success: true });
  }
});

console.log("Job Filler Content Script Loaded");
