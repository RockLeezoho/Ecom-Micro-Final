import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ScrollDropdownTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export const scrollDropdownTabs = (): ScrollDropdownTab[] => [
  {
    id: 'books',
    label: 'Books',
  },
  {
    id: 'electronics',
    label: 'Electronics',
  },
  {
    id: 'fashion',
    label: 'Fashion',
  },
];

interface ScrollDropdownProps {
  tabs?: ScrollDropdownTab[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  triggerLabel?: string;
}

const ScrollDropdown: React.FC<ScrollDropdownProps> = ({
  tabs = scrollDropdownTabs(),
  value,
  onChange,
  onSelect,
  triggerLabel = 'Danh mục',
}) => {
  const [open, setOpen] = useState(false);
  const [internalTabId, setInternalTabId] = useState<string>(tabs[0]?.id ?? 'books');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === internalTabId) && tabs.length > 0) {
      setInternalTabId(tabs[0].id);
    }
  }, [tabs, internalTabId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTabId = value ?? internalTabId;
  const activeTab = tabs.find((tab) => tab.id === currentTabId) ?? tabs[0];

  const handleTabChange = (tabId: string) => {
    setInternalTabId(tabId);
    onChange?.(tabId);
  };

  const handleCategoryClick = (tabId: string) => {
    handleTabChange(tabId);
    onSelect?.(tabId);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary text-white px-4 py-2 text-[11px] font-black uppercase tracking-widest shadow-sm transition-colors hover:bg-primary-light hover:text-primary"
      >
        <span>{activeTab?.label ?? triggerLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && activeTab && (
        <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border border-border-theme bg-white shadow-2xl">
          <div className="flex flex-col gap-2 p-2">
            {tabs.map((tab) => {
              const isActiveTab = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleCategoryClick(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${
                    isActiveTab
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-primary-light/40 text-primary hover:bg-primary-light'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-primary">
                    {tab.icon}
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollDropdown;