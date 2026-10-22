import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Send,
  Server,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  Sparkles,
  ShieldCheck,
  FileText,
  Filter,
  Check,
  Copy,
  Code2,
  Type,
  Database,
  RotateCcw,
  Save,
  Plus,
  Wand2,
  Package,
  Hash,
  User as UserIcon,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SmtpSettings, EmailLog, EmailType, EmailTemplateConfig, EmailEditorMode } from '../../types';
import {
  generateEmailHtml,
  EMAIL_TEMPLATE_VARIABLES,
  compilePlainEnglishToHtml,
  buildDatabaseVariableMap
} from '../../services/emailService';

type ActiveInputField =
  | 'subject'
  | 'heading'
  | 'greeting'
  | 'openingParagraph'
  | 'bodyMessage'
  | 'closingParagraph'
  | 'customHtml';

export const SmtpMailerHub: React.FC = () => {
  const {
    smtpSettings,
    emailLogs,
    emailTemplates,
    updateSmtpSettings,
    updateEmailTemplate,
    resetEmailTemplateToDefault,
    sendTestSmtpEmail,
    siteSettings,
    orders,
    users,
  } = useStore();

  const [formData, setFormData] = useState<SmtpSettings>(smtpSettings);
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test Mailer State
  const [testRecipient, setTestRecipient] = useState(smtpSettings.fromEmail || 'customer@threadcraft.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Email Templates Editor & Preview State
  const [selectedTemplate, setSelectedTemplate] = useState<EmailType>('order_confirmation');
  const [draftTemplate, setDraftTemplate] = useState<EmailTemplateConfig>(
    () => emailTemplates['order_confirmation']
  );
  const [activeField, setActiveField] = useState<ActiveInputField>('openingParagraph');
  const [tagFormat, setTagFormat] = useState<'curly' | 'bracket'>('curly');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => orders[0]?.id || '');
  const [previewTab, setPreviewTab] = useState<'visual' | 'code'>('visual');
  const [templateSavedToast, setTemplateSavedToast] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [insertedTagNotice, setInsertedTagNotice] = useState<string | null>(null);

  // Inspect Modal State
  const [inspectedLog, setInspectedLog] = useState<EmailLog | null>(null);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync draftTemplate when selectedTemplate or stored emailTemplates change
  useEffect(() => {
    if (emailTemplates[selectedTemplate]) {
      setDraftTemplate(emailTemplates[selectedTemplate]);
      setConfirmReset(false);
    }
  }, [selectedTemplate, emailTemplates]);

  // Keep selectedOrderId valid if orders change
  useEffect(() => {
    if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  // Handle Preset Selection
  const applyPreset = (preset: 'cpanel' | 'gmail' | 'ses' | 'mailgun') => {
    if (preset === 'cpanel') {
      setFormData(prev => ({
        ...prev,
        host: 'mail.threadcraft.com',
        port: 587,
        encryption: 'tls',
        username: 'orders@threadcraft.com',
        fromEmail: 'orders@threadcraft.com',
        fromName: siteSettings.siteName || 'ThreadCraft Studio',
      }));
    } else if (preset === 'gmail') {
      setFormData(prev => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 587,
        encryption: 'tls',
        username: 'threadcraft.official@gmail.com',
        fromEmail: 'threadcraft.official@gmail.com',
        fromName: siteSettings.siteName || 'ThreadCraft Studio',
      }));
    } else if (preset === 'ses') {
      setFormData(prev => ({
        ...prev,
        host: 'email-smtp.ap-south-1.amazonaws.com',
        port: 587,
        encryption: 'tls',
        username: 'AKIAIOSFODNN7EXAMPLE',
        fromEmail: 'noreply@threadcraft.com',
        fromName: siteSettings.siteName || 'ThreadCraft Studio',
      }));
    } else if (preset === 'mailgun') {
      setFormData(prev => ({
        ...prev,
        host: 'smtp.mailgun.org',
        port: 587,
        encryption: 'tls',
        username: 'postmaster@mg.threadcraft.com',
        fromEmail: 'orders@threadcraft.com',
        fromName: siteSettings.siteName || 'ThreadCraft Studio',
      }));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSmtpSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSendTest = async (templateToSend: EmailType = selectedTemplate) => {
    if (!testRecipient.trim()) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      // Save current draft before sending so test uses latest edits
      updateEmailTemplate(selectedTemplate, draftTemplate);
      const res = await sendTestSmtpEmail(testRecipient.trim(), templateToSend, selectedOrderId);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'SMTP Handshake or authentication failed.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Resolve bound database order and customer user
  const boundOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
  const boundUser =
    (boundOrder
      ? users.find(u => u.id === boundOrder.userId || u.email === boundOrder.customerEmail)
      : undefined) || users[0];

  // Live variable map from database for display in the DB Inspector bar
  const liveDbVariables = buildDatabaseVariableMap({
    order: boundOrder,
    user: boundUser,
    siteSettings,
    rejectionReason: 'TrxID BK9A77209X not found in bank statement',
    testNote: `Authenticated test from ${formData.username}`,
  });

  // Live rendered preview from current draftTemplate + bound database records
  const templatePreview = generateEmailHtml(selectedTemplate, {
    order: boundOrder,
    user: boundUser,
    siteSettings,
    rejectionReason: 'TrxID BK9A77209X not found in bank statement',
    testNote: `Authenticated test from ${formData.username}`,
    templateConfig: draftTemplate,
  });

  const handleModeSwitch = (editorMode: EmailEditorMode) => {
    setDraftTemplate(prev => ({
      ...prev,
      editorMode,
    }));
    if (editorMode === 'custom_html') {
      setActiveField('customHtml');
    } else if (activeField === 'customHtml') {
      setActiveField('openingParagraph');
    }
  };

  const handleSyncPlainEnglishToHtml = () => {
    const generatedHtml = compilePlainEnglishToHtml(draftTemplate);
    setDraftTemplate(prev => ({
      ...prev,
      editorMode: 'custom_html',
      customHtmlTemplate: generatedHtml,
    }));
    setActiveField('customHtml');
  };

  const handleInsertVariable = (token: string, sampleKey: string) => {
    const plainAliasMap: Record<string, string> = {
      user_name: '[user name]',
      order_number: '[order number]',
      trx_id: '[tranx id]',
      order_date: '[date]',
      products: '[product]',
      products_table: '{{products_table}}',
      grand_total: '[grand total]',
      payment_method: '[payment method]',
      sender_phone: '[sender phone]',
      delivery_zone: '[delivery zone]',
      delivery_fee: '[delivery fee]',
      delivery_address: '[delivery address]',
      carrier_name: '[carrier name]',
      tracking_number: '[tracking number]',
      store_name: '[store name]',
      store_phone: '[store phone]',
    };
    const snippet = tagFormat === 'bracket' ? (plainAliasMap[sampleKey] || token) : token;
    const targetField: ActiveInputField =
      draftTemplate.editorMode === 'custom_html' && activeField !== 'subject' ? 'customHtml' : activeField;

    setDraftTemplate(prev => {
      if (targetField === 'subject') {
        const cur = prev.subjectTemplate || '';
        const sep = cur && !cur.endsWith(' ') ? ' ' : '';
        return { ...prev, subjectTemplate: `${cur}${sep}${snippet}` };
      }
      if (targetField === 'customHtml') {
        const cur = prev.customHtmlTemplate || '';
        const sep = cur && !cur.endsWith(' ') && !cur.endsWith('\n') ? ' ' : '';
        return { ...prev, customHtmlTemplate: `${cur}${sep}${snippet}` };
      }
      const cur = prev.plainEnglish[targetField] || '';
      const sep = cur && !cur.endsWith(' ') && !cur.endsWith('\n') ? ' ' : '';
      return {
        ...prev,
        plainEnglish: {
          ...prev.plainEnglish,
          [targetField]: `${cur}${sep}${snippet}`,
        },
      };
    });

    setInsertedTagNotice(`Inserted ${snippet} into ${targetField}`);
    setTimeout(() => setInsertedTagNotice(null), 2000);
  };

  const handleSaveTemplate = () => {
    updateEmailTemplate(selectedTemplate, draftTemplate);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 2500);
  };

  const handleResetTemplate = () => {
    resetEmailTemplateToDefault(selectedTemplate);
    setConfirmReset(false);
  };

  const filteredLogs = emailLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  const templateTypesList: { id: EmailType; label: string }[] = [
    { id: 'order_confirmation', label: 'Order Confirmed' },
    { id: 'payment_verified', label: 'Payment Approved' },
    { id: 'payment_rejected', label: 'Payment Rejected' },
    { id: 'order_shipped', label: 'Courier Dispatched' },
    { id: 'welcome', label: 'Welcome Bonus' },
    { id: 'admin_alert', label: 'Admin New Order' },
    { id: 'test', label: 'SMTP Handshake' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-xl p-6 text-white border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Server className="w-4 h-4" />
            <span>Mailing System, SMTP Relay & Template Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            SMTP Mailer & Editable Email Template Studio
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
            Configure authenticated SMTP servers, customize all transactional email templates in{' '}
            <strong className="text-white">Plain English</strong> or{' '}
            <strong className="text-white">Custom HTML</strong>, and dynamically inject live database records (TrxID, User Name, Date, Order Number, Products).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-stone-800/80 border border-stone-700/60 rounded-lg px-4 py-2 text-xs">
            <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Server Status</div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formData.isEnabled ? 'SMTP Online' : 'Mailer Disabled'}</span>
            </div>
          </div>

          <div className="bg-stone-800/80 border border-stone-700/60 rounded-lg px-4 py-2 text-xs">
            <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Dispatched</div>
            <div className="font-bold text-white text-sm mt-0.5">{emailLogs.length} messages</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DUAL-MODE EMAIL TEMPLATE STUDIO (PLAIN ENGLISH + HTML + DATABASE BINDING) */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Studio Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                Live Database Bound
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-wider">
                Plain English &amp; HTML Modes
              </span>
            </div>
            <h3 className="font-extrabold text-stone-900 text-base sm:text-lg mt-1.5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Transactional Email Template Editor</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              Edit templates in plain English or raw HTML. Placeholders like{' '}
              <code className="px-1.5 py-0.5 bg-stone-200/80 rounded text-stone-900 font-mono text-[11px]">
                {'{{trx_id}}'}
              </code>{' '}
              or{' '}
              <code className="px-1.5 py-0.5 bg-stone-200/80 rounded text-stone-900 font-mono text-[11px]">
                [tranx id]
              </code>
              ,{' '}
              <code className="px-1.5 py-0.5 bg-stone-200/80 rounded text-stone-900 font-mono text-[11px]">
                [user name]
              </code>
              ,{' '}
              <code className="px-1.5 py-0.5 bg-stone-200/80 rounded text-stone-900 font-mono text-[11px]">
                [date]
              </code>
              ,{' '}
              <code className="px-1.5 py-0.5 bg-stone-200/80 rounded text-stone-900 font-mono text-[11px]">
                [order number]
              </code>
              , and{' '}
              <code className="px-1.5 py-0.5 bg-stone-200/80 rounded text-stone-900 font-mono text-[11px]">
                [product]
              </code>{' '}
              are automatically populated from the database.
            </p>
          </div>

          {/* Template Selector Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {templateTypesList.map(tpl => {
              const savedTpl = emailTemplates[tpl.id];
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{tpl.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                      isSelected
                        ? 'bg-stone-700 text-stone-200'
                        : savedTpl?.editorMode === 'custom_html'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {savedTpl?.editorMode === 'custom_html' ? 'HTML' : 'EN'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Database Binding Bar (Select Real Order from DB to preview & test) */}
        <div className="px-4 sm:px-6 py-3.5 bg-stone-900 text-white border-b border-stone-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold uppercase tracking-wider text-[11px] shrink-0">
              <Database className="w-4 h-4 shrink-0" />
              <span>Database Record Binding:</span>
            </div>

            <select
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full sm:w-auto max-w-full px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-white font-mono text-xs focus:outline-none focus:border-blue-400 truncate"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  #{o.orderNumber} — {o.customerName} ({o.paymentMethodSnapshot.name} • TrxID: {o.paymentClaim?.transactionId || 'COD'})
                </option>
              ))}
            </select>
          </div>

          {/* Resolved Database Fields Snapshot */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 flex items-center gap-1.5">
              <UserIcon className="w-3 h-3 text-emerald-400" />
              <span className="text-stone-400">User:</span>
              <strong className="text-white font-mono">{liveDbVariables.user_name}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-blue-400" />
              <span className="text-stone-400">Order #:</span>
              <strong className="text-white font-mono">{liveDbVariables.order_number}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 flex items-center gap-1.5">
              <CreditCard className="w-3 h-3 text-amber-400" />
              <span className="text-stone-400">TrxID:</span>
              <strong className="text-amber-300 font-mono">{liveDbVariables.trx_id}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-purple-400" />
              <span className="text-stone-400">Date:</span>
              <strong className="text-white font-mono">{liveDbVariables.order_date}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 flex items-center gap-1.5 max-w-xs truncate">
              <Package className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="text-stone-400">Product:</span>
              <strong className="text-white truncate">{liveDbVariables.products}</strong>
            </span>
          </div>
        </div>

        {/* 1-Click Database Placeholder Variable Injector Bar */}
        <div className="px-4 sm:px-6 py-3 bg-blue-50/60 border-b border-stone-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px]">
                Click to Insert Database Variable into <span className="text-blue-700 underline">{activeField}</span>:
              </span>
              {insertedTagNotice && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {insertedTagNotice}
                </span>
              )}
            </div>

            {/* Syntax Style Toggle ({{trx_id}} vs [tranx id]) */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-stone-500 font-medium">Tag Syntax:</span>
              <button
                type="button"
                onClick={() => setTagFormat('curly')}
                className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer ${
                  tagFormat === 'curly'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {'{{trx_id}}'}
              </button>
              <button
                type="button"
                onClick={() => setTagFormat('bracket')}
                className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer ${
                  tagFormat === 'bracket'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                [tranx id]
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EMAIL_TEMPLATE_VARIABLES.map(v => {
              const plainBracketLabel = `[${v.sampleKey.replace(/_/g, ' ')}]`;
              return (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => handleInsertVariable(v.token, v.sampleKey)}
                  title={`${v.description} (Live DB Value: ${liveDbVariables[v.sampleKey] || ''})`}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 border border-stone-200 text-stone-800 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer group"
                >
                  <Plus className="w-3 h-3 text-blue-600 group-hover:text-white" />
                  <span>{v.label}</span>
                  <code className="text-[10px] font-mono text-stone-500 group-hover:text-blue-100 ml-0.5">
                    {tagFormat === 'bracket' ? plainBracketLabel : v.token}
                  </code>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Studio Grid: Left = Editor (Plain English or HTML), Right = Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          {/* LEFT COLUMN: Editor Controls (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-5 min-w-0">
            {/* Editor Mode Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('plain_english')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    draftTemplate.editorMode === 'plain_english'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Type className="w-4 h-4 text-blue-600" />
                  <span>Plain English Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('custom_html')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    draftTemplate.editorMode === 'custom_html'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-amber-500" />
                  <span>Custom HTML Mode</span>
                </button>
              </div>

              {draftTemplate.editorMode === 'plain_english' ? (
                <button
                  type="button"
                  onClick={handleSyncPlainEnglishToHtml}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Compile current Plain English text into editable HTML code"
                >
                  <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Convert Plain English to HTML</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSyncPlainEnglishToHtml}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Rebuild HTML from Plain English Fields</span>
                </button>
              )}
            </div>

            {/* Subject Line (Shared across both Plain English and HTML modes) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-extrabold text-stone-800">
                  Email Subject Line *
                </label>
                <span className="text-[10px] font-mono text-stone-400">
                  Supports {'{{order_number}}'}, {'{{trx_id}}'}, [order number], [user name]
                </span>
              </div>
              <input
                type="text"
                value={draftTemplate.subjectTemplate}
                onFocus={() => setActiveField('subject')}
                onChange={e => setDraftTemplate({ ...draftTemplate, subjectTemplate: e.target.value })}
                placeholder="Order Confirmed: #{{order_number}} — {{store_name}}"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  activeField === 'subject' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-300'
                }`}
              />
            </div>

            {/* MODE A: PLAIN ENGLISH STRUCTURED EDITOR */}
            {draftTemplate.editorMode === 'plain_english' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Header Banner Heading
                    </label>
                    <input
                      type="text"
                      value={draftTemplate.plainEnglish.heading}
                      onFocus={() => setActiveField('heading')}
                      onChange={e =>
                        setDraftTemplate({
                          ...draftTemplate,
                          plainEnglish: { ...draftTemplate.plainEnglish, heading: e.target.value },
                        })
                      }
                      placeholder="Order Confirmed (#{{order_number}})"
                      className={`w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none ${
                        activeField === 'heading' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Banner Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTemplate.plainEnglish.accentColor || '#1c1917'}
                        onChange={e =>
                          setDraftTemplate({
                            ...draftTemplate,
                            plainEnglish: { ...draftTemplate.plainEnglish, accentColor: e.target.value },
                          })
                        }
                        className="w-9 h-9 rounded border border-stone-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={draftTemplate.plainEnglish.accentColor || '#1c1917'}
                        onChange={e =>
                          setDraftTemplate({
                            ...draftTemplate,
                            plainEnglish: { ...draftTemplate.plainEnglish, accentColor: e.target.value },
                          })
                        }
                        className="w-full px-2 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Customer Greeting (Plain English)
                  </label>
                  <input
                    type="text"
                    value={draftTemplate.plainEnglish.greeting}
                    onFocus={() => setActiveField('greeting')}
                    onChange={e =>
                      setDraftTemplate({
                        ...draftTemplate,
                        plainEnglish: { ...draftTemplate.plainEnglish, greeting: e.target.value },
                      })
                    }
                    placeholder="Hello {{user_name}},"
                    className={`w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none ${
                      activeField === 'greeting' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Opening Paragraph (Plain English)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      Write naturally — e.g. &quot;Thank you [user name] for order #[order number] on [date]...&quot;
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={draftTemplate.plainEnglish.openingParagraph}
                    onFocus={() => setActiveField('openingParagraph')}
                    onChange={e =>
                      setDraftTemplate({
                        ...draftTemplate,
                        plainEnglish: { ...draftTemplate.plainEnglish, openingParagraph: e.target.value },
                      })
                    }
                    placeholder="Thank you for shopping with {{store_name}}! Your order #{{order_number}} placed on {{order_date}} has been received."
                    className={`w-full px-3 py-2 border rounded-lg text-xs leading-relaxed bg-white focus:outline-none ${
                      activeField === 'openingParagraph' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Main Body / Payment &amp; Product Details (Plain English)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      Supports multi-line text &amp; database tags
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={draftTemplate.plainEnglish.bodyMessage}
                    onFocus={() => setActiveField('bodyMessage')}
                    onChange={e =>
                      setDraftTemplate({
                        ...draftTemplate,
                        plainEnglish: { ...draftTemplate.plainEnglish, bodyMessage: e.target.value },
                      })
                    }
                    placeholder="We have recorded your {{payment_method}} payment with Transaction ID: {{trx_id}} for {{products}}."
                    className={`w-full px-3 py-2 border rounded-lg text-xs leading-relaxed bg-white focus:outline-none ${
                      activeField === 'bodyMessage' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-300'
                    }`}
                  />
                </div>

                {/* Automatic Database Blocks Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={draftTemplate.plainEnglish.includeOrderDetailsBox}
                      onChange={e =>
                        setDraftTemplate({
                          ...draftTemplate,
                          plainEnglish: {
                            ...draftTemplate.plainEnglish,
                            includeOrderDetailsBox: e.target.checked,
                          },
                        })
                      }
                      className="mt-0.5 accent-blue-600 rounded"
                    />
                    <div>
                      <div className="font-bold text-stone-900">Include Database Order &amp; TrxID Box</div>
                      <div className="text-[11px] text-stone-500">
                        Automatically displays Order #, Date, Payment Method, TrxID, and Delivery Zone from DB.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={draftTemplate.plainEnglish.includeProductsTable}
                      onChange={e =>
                        setDraftTemplate({
                          ...draftTemplate,
                          plainEnglish: {
                            ...draftTemplate.plainEnglish,
                            includeProductsTable: e.target.checked,
                          },
                        })
                      }
                      className="mt-0.5 accent-blue-600 rounded"
                    />
                    <div>
                      <div className="font-bold text-stone-900">Include Purchased Products Table</div>
                      <div className="text-[11px] text-stone-500">
                        Renders itemized product names, sizes, quantities, and Grand Total from the order database.
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Closing Paragraph / Footer Note (Plain English)
                  </label>
                  <textarea
                    rows={2}
                    value={draftTemplate.plainEnglish.closingParagraph}
                    onFocus={() => setActiveField('closingParagraph')}
                    onChange={e =>
                      setDraftTemplate({
                        ...draftTemplate,
                        plainEnglish: { ...draftTemplate.plainEnglish, closingParagraph: e.target.value },
                      })
                    }
                    placeholder="If you have any questions, reply to this email or call {{store_phone}}."
                    className={`w-full px-3 py-2 border rounded-lg text-xs leading-relaxed bg-white focus:outline-none ${
                      activeField === 'closingParagraph' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-300'
                    }`}
                  />
                </div>
              </div>
            ) : (
              /* MODE B: CUSTOM RAW HTML EDITOR */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-amber-600" />
                    <span>Custom HTML Template Source Code</span>
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Use <code className="font-mono text-stone-800">{'{{products_table}}'}</code> for full HTML items table or <code className="font-mono text-stone-800">{'{{trx_id}}'}</code>
                  </span>
                </div>

                <textarea
                  rows={16}
                  value={draftTemplate.customHtmlTemplate}
                  onFocus={() => setActiveField('customHtml')}
                  onChange={e => setDraftTemplate({ ...draftTemplate, customHtmlTemplate: e.target.value })}
                  placeholder="<div>Write custom HTML with {{user_name}}, {{order_number}}, {{trx_id}}, {{order_date}}, {{products}}, {{products_table}}...</div>"
                  className="w-full p-4 border border-stone-800 rounded-xl text-xs font-mono leading-relaxed bg-stone-950 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Save / Reset / Test Action Bar */}
            <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs">
                    <span className="text-rose-800 font-bold">Reset template?</span>
                    <button
                      type="button"
                      onClick={handleResetTemplate}
                      className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-0.5 bg-white text-stone-600 border border-stone-200 rounded font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {templateSavedToast && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Template saved!</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSendingTest || !testRecipient.trim()}
                  onClick={() => handleSendTest(selectedTemplate)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test with DB Order #{boundOrder?.orderNumber || '1042'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-blue-600 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Database-Populated Preview (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 bg-stone-50/50 space-y-4 flex flex-col min-w-0">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-600" />
                  <span>Live Database-Rendered Preview</span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Showing real values from Order <strong className="text-stone-800">#{boundOrder?.orderNumber}</strong> ({boundOrder?.customerName})
                </p>
              </div>

              {/* Visual / Compiled HTML Toggle */}
              <div className="flex items-center border border-stone-200 rounded-lg p-0.5 bg-white text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('visual')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    previewTab === 'visual' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Visual Email
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('code')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    previewTab === 'code' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Compiled HTML
                </button>
              </div>
            </div>

            {/* Resolved Subject Line Preview */}
            <div className="bg-white border border-stone-200 rounded-lg p-3 text-xs shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                <span>Resolved Subject Line</span>
                <span className="font-mono text-emerald-700">To: {boundOrder?.customerEmail || testRecipient}</span>
              </div>
              <div className="font-bold text-stone-900 text-xs">{templatePreview.subject}</div>
            </div>

            {/* Template Render Box */}
            {previewTab === 'visual' ? (
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-100 p-3 flex-1 max-h-[540px] overflow-y-auto">
                <div
                  className="bg-white rounded-lg shadow-xs p-1"
                  dangerouslySetInnerHTML={{ __html: templatePreview.html }}
                />
              </div>
            ) : (
              <div className="relative flex-1">
                <pre className="border border-stone-800 rounded-xl bg-stone-950 text-stone-200 p-4 text-[11px] font-mono max-h-[540px] overflow-auto leading-relaxed">
                  {templatePreview.html}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(templatePreview.html);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy HTML'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: SMTP SERVER CREDENTIALS & LIVE TEST DISPATCHER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: SMTP Configuration & Triggers (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>SMTP Connection Credentials</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Production mail credentials used for sending transactional receipts &amp; updates.
                </p>
              </div>

              {/* Status Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-stone-700">
                  {formData.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Quick Provider Presets */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                Quick Setup Presets (Auto-fill host &amp; ports)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('cpanel')}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5 text-stone-600" />
                  <span>cPanel Webmail</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('gmail')}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Google Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('ses')}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Amazon SES</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('mailgun')}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>Mailgun</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    SMTP Host / Server Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.host}
                    onChange={e => setFormData({ ...formData, host: e.target.value })}
                    placeholder="mail.threadcraft.com or smtp.gmail.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Port *</label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={e => setFormData({ ...formData, port: parseInt(e.target.value, 10) || 587 })}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Encryption Protocol
                  </label>
                  <select
                    value={formData.encryption}
                    onChange={e => setFormData({ ...formData, encryption: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="tls">STARTTLS (Port 587 - Recommended)</option>
                    <option value="ssl">SSL / SMTPS (Port 465)</option>
                    <option value="none">None / Plain (Port 25 / 2525)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    SMTP Username / Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="orders@threadcraft.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      SMTP Password / App Key *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                    >
                      {showPassword ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sender From Name
                  </label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={e => setFormData({ ...formData, fromName: e.target.value })}
                    placeholder="ThreadCraft Studio"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sender From Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.fromEmail}
                    onChange={e => setFormData({ ...formData, fromEmail: e.target.value })}
                    placeholder="orders@threadcraft.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Admin Alert Recipient Email
                  </label>
                  <input
                    type="email"
                    value={formData.adminAlertEmail}
                    onChange={e => setFormData({ ...formData, adminAlertEmail: e.target.value })}
                    placeholder="admin@threadcraft.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notification Triggers Checkboxes */}
              <div className="pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold text-stone-900 mb-2">
                  Automated Event Notification Triggers
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.orderConfirmation}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            orderConfirmation: e.target.checked,
                          },
                        })
                      }
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium text-stone-700">Order Confirmation (Customer)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.paymentVerified}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            paymentVerified: e.target.checked,
                          },
                        })
                      }
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium text-stone-700">Payment Approved / Rejected</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.orderDispatched}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            orderDispatched: e.target.checked,
                          },
                        })
                      }
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium text-stone-700">Dispatched with Tracking</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.welcomeEmail}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            welcomeEmail: e.target.checked,
                          },
                        })
                      }
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium text-stone-700">Welcome &amp; Loyalty Bonus</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={formData.notifications.adminNewOrderAlert}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            adminNewOrderAlert: e.target.checked,
                          },
                        })
                      }
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium text-stone-700">Immediate New Order Alert to Admin Email</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SMTP configuration saved &amp; active!</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">
                    Host: {formData.host}:{formData.port} ({formData.encryption.toUpperCase()})
                  </span>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-blue-600 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Server className="w-4 h-4" />
                  <span>Save SMTP Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Interactive SMTP Dispatch Tester (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Live SMTP Relay Test Dispatcher</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Dispatch any customized template with live database order details to verify your SMTP server and placeholder resolution.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Selected Template:</span>
                  <span className="font-bold text-stone-900">{draftTemplate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Template Mode:</span>
                  <span className="font-mono text-[11px] font-bold text-blue-700 uppercase">
                    {draftTemplate.editorMode === 'custom_html' ? 'Custom HTML' : 'Plain English'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Database Order Bound:</span>
                  <span className="font-mono font-bold text-stone-800">
                    #{boundOrder?.orderNumber} ({boundOrder?.customerName})
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSendingTest || !testRecipient.trim()}
                onClick={() => handleSendTest(selectedTemplate)}
                className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting via {formData.host}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch &quot;{draftTemplate.name}&quot; Test Email</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{testResult.success ? 'Transmission Successful' : 'Transmission Error'}</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Dispatched Emails Real-time Audit Log */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Real-time SMTP Dispatch &amp; Transmission Ledger</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Every transactional notification dispatched across the application is recorded with full delivery details.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={logFilter}
              onChange={e => setLogFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-medium text-stone-800 outline-none text-xs"
            >
              <option value="all">All Notification Types ({emailLogs.length})</option>
              <option value="order_confirmation">Order Confirmations</option>
              <option value="payment_verified">Payment Approvals</option>
              <option value="payment_rejected">Payment Rejections</option>
              <option value="order_shipped">Courier Dispatched</option>
              <option value="welcome">Welcome Bonus</option>
              <option value="admin_alert">Admin Alerts</option>
              <option value="test">Test Handshakes</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
            <p className="font-semibold text-stone-600">No emails matching filter</p>
            <p className="text-stone-400 mt-1">Dispatches appear here in real-time as events occur.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Relay Host</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900 whitespace-nowrap">
                      {log.to}
                    </td>
                    <td className="py-3 px-4 text-stone-700 max-w-xs truncate font-medium">
                      {log.subject}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.type === 'order_confirmation'
                            ? 'bg-blue-100 text-blue-800'
                            : log.type === 'payment_verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.type === 'payment_rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : log.type === 'welcome'
                            ? 'bg-purple-100 text-purple-800'
                            : log.type === 'test'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {log.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                      {log.smtpHostUsed || formData.host}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Delivered</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectedLog(log)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Full Sent Email Inspection Modal */}
      <AnimatePresence>
        {inspectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92dvh] overflow-hidden border border-stone-200 flex flex-col text-xs"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <h3 className="font-extrabold text-stone-900 text-sm">Dispatched Email Message</h3>
                </div>
                <button
                  onClick={() => setInspectedLog(null)}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Message Headers */}
              <div className="p-4 border-b border-stone-200 bg-white space-y-2 text-[11px] font-mono">
                <div className="flex">
                  <span className="w-20 text-stone-400 font-semibold uppercase">From:</span>
                  <span className="text-stone-900 font-bold">{inspectedLog.from}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-stone-400 font-semibold uppercase">To:</span>
                  <span className="text-stone-900 font-bold">{inspectedLog.to}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-stone-400 font-semibold uppercase">Subject:</span>
                  <span className="text-stone-900 font-bold">{inspectedLog.subject}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-stone-400 font-semibold uppercase">Date:</span>
                  <span className="text-stone-600">{new Date(inspectedLog.sentAt).toLocaleString()}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-stone-400 font-semibold uppercase">Relay:</span>
                  <span className="text-stone-600">{inspectedLog.smtpHostUsed || formData.host}</span>
                </div>
              </div>

              {/* Rendered Body */}
              <div className="p-4 overflow-y-auto flex-1 bg-stone-100">
                <div
                  className="bg-white rounded-lg shadow-xs p-2 max-w-xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: inspectedLog.htmlContent }}
                />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectedLog(null)}
                  className="px-4 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800 transition-colors"
                >
                  Close Message
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
