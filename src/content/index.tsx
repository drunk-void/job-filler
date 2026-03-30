import type { FormFieldData } from '../lib/ai';
import { loadSettings } from '../lib/storage';

const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  const arr = base64.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
};

const extractFields = (): FormFieldData[] => {
  const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
  const data: FormFieldData[] = [];
  const nameToGroupIndex = new Map<string, number>();

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

    let optionText = labelText || (el as HTMLInputElement).value || '';

    let options: string[] | undefined;
    if (el.tagName.toLowerCase() === 'select') {
      options = Array.from((el as HTMLSelectElement).options).map(o => o.text);
    } else if (type === 'radio' || type === 'checkbox') {
      options = [optionText];
    }

    // Handle grouping for radios and checkboxes
    if ((type === 'radio' || type === 'checkbox') && name) {
      if (nameToGroupIndex.has(name)) {
        const existingData = data[nameToGroupIndex.get(name)!];
        if (existingData.options && !existingData.options.includes(optionText)) {
          existingData.options.push(optionText);
        }
        return; // Skip adding a new field
      }
    }

    // Try to find a parent legend/group label if it's a grouped field
    if ((type === 'radio' || type === 'checkbox') && name) {
      const fieldset = el.closest('fieldset');
      if (fieldset) {
        const legend = fieldset.querySelector('legend');
        if (legend) {
          labelText = legend.textContent?.trim() || labelText;
        }
      } else {
        const groupContainer = el.closest('.form-group') || el.closest('div');
        if (groupContainer) {
          // Look for the first label in the group container
          const groupLabel = groupContainer.querySelector('label')?.textContent?.trim();
          // We only want to use it if it's distinct from the option text itself
          if (groupLabel && !groupLabel.includes(optionText) && !optionText.includes(groupLabel)) {
            labelText = groupLabel;
          }
        }
      }
    }

    const generatedId = id || name || Math.random().toString(36).substr(2, 9);

    data.push({
      id: generatedId,
      name,
      type,
      label: labelText || name, // Fallback to name if no label found
      placeholder,
      value: (el as HTMLInputElement).value || '',
      options: options?.length ? options : undefined,
      required: (el as HTMLInputElement).required || undefined,
      min: (el as HTMLInputElement).min || undefined,
      max: (el as HTMLInputElement).max || undefined,
      maxlength: el.getAttribute('maxlength') || undefined,
      pattern: el.getAttribute('pattern') || undefined,
      autocomplete: el.getAttribute('autocomplete') || undefined,
    });
    
    if ((type === 'radio' || type === 'checkbox') && name) {
      nameToGroupIndex.set(name, data.length - 1);
    }
    
    // Ensure the element has an ID for later injection, but NOT if grouped by name
    if (!el.id && type !== 'radio' && type !== 'checkbox') {
      el.id = generatedId;
    }
  });

  return data;
};

const fillInput = async (id: string, value: string | string[]) => {
  const elements = Array.from(document.querySelectorAll(`[id="${id}"], [name="${id}"]`)) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];
  if (!elements.length) return;

  const type = elements[0].tagName.toLowerCase() === 'select' ? 'select' : (elements[0] as HTMLInputElement).type || 'text';

  if (type === 'file') {
    const el = elements[0] as HTMLInputElement;
    // Intelligently check if this looks like a resume field
    const label = (el.getAttribute('aria-label') || '').toLowerCase();
    const name = (el.getAttribute('name') || '').toLowerCase();
    const elId = (el.id || '').toLowerCase();
    const accept = (el.getAttribute('accept') || '').toLowerCase();
    
    // Also check parent container or label text for clues, as file inputs often hide the real input
    const parentLabelText = (el.closest('label')?.textContent || '').toLowerCase();
    const parentContainerText = (el.parentElement?.textContent || '').toLowerCase();
    
    const searchString = `${label} ${name} ${elId} ${accept} ${parentLabelText} ${parentContainerText}`;
    const resumeKeywords = ['resume', 'cv', 'upload', 'file', 'pdf'];
    const isResumeField = resumeKeywords.some(keyword => searchString.includes(keyword));
    
    if (isResumeField) {
      const settings = await loadSettings();
      if (settings.resumeFileData && settings.resumeFileName && settings.resumeFileType) {
        const file = base64ToFile(settings.resumeFileData, settings.resumeFileName, settings.resumeFileType);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        el.files = dataTransfer.files;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    return;
  }

  const valArray = Array.isArray(value) ? value.map(v => String(v).toLowerCase()) : [String(value).toLowerCase()];
  const stringValue = Array.isArray(value) ? value.join(', ') : String(value);

  if (type === 'select') {
    const select = elements[0] as HTMLSelectElement;
    if (select.multiple) {
      for (let i = 0; i < select.options.length; i++) {
        select.options[i].selected = valArray.some(val => select.options[i].text.toLowerCase().includes(val) || select.options[i].value.toLowerCase().includes(val));
      }
    } else {
      for (let i = 0; i < select.options.length; i++) {
        if (valArray.some(val => select.options[i].text.toLowerCase().includes(val) || select.options[i].value.toLowerCase().includes(val))) {
          select.selectedIndex = i;
          break;
        }
      }
    }
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (type === 'radio' || type === 'checkbox') {
    elements.forEach((el) => {
      const input = el as HTMLInputElement;
      let labelText = '';
      if (input.id) {
        const labelEl = document.querySelector(`label[for="${input.id}"]`);
        if (labelEl) labelText = labelEl.textContent?.trim() || '';
      }
      if (!labelText) {
        const parentLabel = input.closest('label');
        if (parentLabel) labelText = parentLabel.textContent?.replace(input.textContent || '', '').trim() || '';
      }
      const optionText = (labelText || input.value || '').toLowerCase();
      
      if (elements.length === 1 && type === 'checkbox') {
        input.checked = valArray[0] === 'true' || valArray[0] === 'yes' || valArray[0] === 'on';
      } else {
        input.checked = valArray.some(val => optionText.includes(val) || input.value.toLowerCase() === val);
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  } else {
    const el = elements[0] as HTMLInputElement | HTMLTextAreaElement;
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    
    let finalValue = stringValue;
    if (type === 'number') {
      // Strip non-numeric characters for number inputs
      const match = finalValue.match(/-?\d+(\.\d+)?/);
      finalValue = match ? match[0] : '';
    }
    
    // Use native setter to bypass React/Vue/Angular synthetic events
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      ?? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, finalValue);
    } else {
      el.value = finalValue;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }
};

let sidebarShadow: ShadowRoot | null = null;
let isMinimized = false;

const toggleSidebar = () => {
  const existingContainer = document.getElementById('job-filler-sidebar-container');
  
  if (existingContainer) {
    existingContainer.remove();
    sidebarShadow = null;
    return;
  }

  const container = document.createElement('div');
  container.id = 'job-filler-sidebar-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.right = '0';
  container.style.height = '100vh';
  container.style.zIndex = '2147483647';
  container.style.display = 'flex';
  container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  sidebarShadow = container.attachShadow({ mode: 'open' });
  
  const style = document.createElement('style');
  style.textContent = `
    .sidebar-frame {
      width: 400px;
      height: 100%;
      border: none;
      box-shadow: -5px 0 25px rgba(0,0,0,0.15);
      background: white;
    }
    .toggle-handle {
      position: absolute;
      left: -40px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 80px;
      background: #6366f1;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 12px 0 0 12px;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      font-size: 20px;
      user-select: none;
      transition: background 0.2s;
    }
    .toggle-handle:hover {
      background: #4f46e5;
    }
  `;
  sidebarShadow.appendChild(style);

  const iframe = document.createElement('iframe');
  iframe.className = 'sidebar-frame';
  iframe.src = chrome.runtime.getURL('src/panel/index.html');
  sidebarShadow.appendChild(iframe);

  const handle = document.createElement('div');
  handle.className = 'toggle-handle';
  handle.innerHTML = '‹';
  handle.onclick = () => {
    isMinimized = !isMinimized;
    container.style.transform = isMinimized ? 'translateX(400px)' : 'translateX(0)';
    handle.innerHTML = isMinimized ? '›' : '‹';
  };
  sidebarShadow.appendChild(handle);

  document.body.appendChild(container);
};

// Listen for messages from the sidebar / background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'EXTRACT_FIELDS') {
    const fields = extractFields();
    sendResponse({ fields });
  } else if (request.type === 'FILL_INPUT') {
    fillInput(request.id, request.value).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.type === 'FILL_ALL') {
    const data = request.data; // Record<id, value>
    const fillPromises = Object.entries(data).map(([id, value]) => {
      return fillInput(id, value as string | string[]);
    });
    
    // Also try to find resume fields that might not be in the AI answers
    const allInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));
    allInputs.forEach(input => {
      if ((input.id && !data[input.id]) || (input.name && !data[input.name])) {
        fillPromises.push(fillInput(input.id || input.name, ''));
      }
    });

    Promise.all(fillPromises).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  } else if (request.type === 'TOGGLE_SIDEBAR') {
    toggleSidebar();
    sendResponse({ success: true });
  }
});

console.log("Job Filler Content Script Loaded");
