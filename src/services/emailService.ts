import type {
  Order,
  User,
  SiteSettings,
  EmailType,
  SmtpSettings,
  EmailTemplateConfig
} from '../types';

export const initialSmtpSettings: SmtpSettings = {
  host: 'mail.threadcraft.com',
  port: 587,
  encryption: 'tls',
  username: 'notifications@threadcraft.com',
  password: '••••••••••••••••',
  fromName: 'ThreadCraft Studio',
  fromEmail: 'orders@threadcraft.com',
  adminAlertEmail: 'tanvir@threadcraft.com',
  isEnabled: true,
  notifications: {
    orderConfirmation: true,
    paymentVerified: true,
    orderDispatched: true,
    welcomeEmail: true,
    adminNewOrderAlert: true,
  },
};

export interface EmailVariableDefinition {
  token: string;
  label: string;
  description: string;
  sampleKey: string;
}

export const EMAIL_TEMPLATE_VARIABLES: EmailVariableDefinition[] = [
  { token: '{{user_name}}', label: 'Customer Name', description: 'Customer full name from database', sampleKey: 'user_name' },
  { token: '{{order_number}}', label: 'Order Number', description: 'Unique order reference (e.g. ORD-2026-1042)', sampleKey: 'order_number' },
  { token: '{{trx_id}}', label: 'Transaction ID (TrxID)', description: 'bKash/Nagad/Rocket payment TrxID', sampleKey: 'trx_id' },
  { token: '{{order_date}}', label: 'Order Date', description: 'Formatted date the order was placed', sampleKey: 'order_date' },
  { token: '{{products}}', label: 'Product List (Text)', description: 'Plain-English summary of ordered products, sizes & quantities', sampleKey: 'products' },
  { token: '{{products_table}}', label: 'Products Table (HTML)', description: 'Full itemized HTML table of ordered products from database', sampleKey: 'products_table' },
  { token: '{{grand_total}}', label: 'Grand Total', description: 'Total order payable amount with currency symbol', sampleKey: 'grand_total' },
  { token: '{{payment_method}}', label: 'Payment Method', description: 'Selected payment method (e.g. bKash Merchant, COD)', sampleKey: 'payment_method' },
  { token: '{{sender_phone}}', label: 'Sender Phone', description: 'Customer / payment sender mobile number', sampleKey: 'sender_phone' },
  { token: '{{delivery_zone}}', label: 'Delivery Zone', description: 'Assigned delivery zone name', sampleKey: 'delivery_zone' },
  { token: '{{delivery_fee}}', label: 'Delivery Fee', description: 'Calculated zone shipping fee', sampleKey: 'delivery_fee' },
  { token: '{{delivery_address}}', label: 'Delivery Address', description: 'Full recipient street address, area, and district', sampleKey: 'delivery_address' },
  { token: '{{carrier_name}}', label: 'Courier Carrier', description: 'Assigned shipping courier (e.g. Steadfast Courier)', sampleKey: 'carrier_name' },
  { token: '{{tracking_number}}', label: 'Tracking Number', description: 'Courier consignment / tracking code', sampleKey: 'tracking_number' },
  { token: '{{store_name}}', label: 'Store Name', description: 'Storefront brand name from site settings', sampleKey: 'store_name' },
  { token: '{{store_phone}}', label: 'Store Helpline', description: 'Support phone number from site settings', sampleKey: 'store_phone' },
];

const buildDefaultHtmlFromPlain = (
  plain: EmailTemplateConfig['plainEnglish'],
  includeRejectionBox = false
): string => {
  return `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden;">
  <div style="background-color: ${plain.accentColor || '#0c0a09'}; padding: 26px 24px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 21px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">
      {{store_logo_text}}
    </h1>
    <p style="color: rgba(255,255,255,0.75); font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px;">
      ${plain.heading}
    </p>
  </div>
  <div style="padding: 24px; color: #1c1917; font-size: 13px; line-height: 1.6;">
    <p style="font-size: 14px; margin-top: 0;"><strong>${plain.greeting}</strong></p>
    <p style="color: #44403c; white-space: pre-line;">${plain.openingParagraph}</p>
    ${
      plain.bodyMessage
        ? `<div style="background-color: #fafaf9; border-left: 4px solid ${plain.accentColor || '#0c0a09'}; padding: 12px 14px; border-radius: 4px; margin: 16px 0; color: #292524; white-space: pre-line;">${plain.bodyMessage}</div>`
        : ''
    }
    ${
      includeRejectionBox
        ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px 14px; border-radius: 6px; margin: 16px 0; color: #991b1b;"><strong>Reason:</strong> "{{rejection_reason}}"</div>`
        : ''
    }
    ${plain.includeOrderDetailsBox ? '{{order_details_box}}' : ''}
    ${plain.includeProductsTable ? '{{products_table}}' : ''}
    <p style="color: #57534e; margin-top: 18px; white-space: pre-line;">${plain.closingParagraph}</p>
  </div>
  <div style="background-color: #f5f5f4; padding: 18px 20px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #e7e5e4;">
    <p style="margin: 0 0 4px 0;"><strong>{{store_name}}</strong> · {{store_address}}</p>
    <p style="margin: 0;">Helpline: {{store_phone}} | Support: {{store_email}}</p>
  </div>
</div>`;
};

export const getInitialEmailTemplates = (): Record<EmailType, EmailTemplateConfig> => {
  const now = '2026-09-12T08:00:00Z';

  const orderConfirmationPlain: EmailTemplateConfig['plainEnglish'] = {
    heading: 'Order Confirmation & Receipt',
    greeting: 'Hi {{user_name}},',
    openingParagraph:
      'Thank you for your order with {{store_name}}! We have received your order #{{order_number}} placed on {{order_date}} for: {{products}}.',
    bodyMessage:
      'Payment Method: {{payment_method}}\nTransaction ID (TrxID): {{trx_id}}\nSender Phone: {{sender_phone}}\nDelivery Destination: {{delivery_address}} ({{delivery_zone}})',
    includeOrderDetailsBox: true,
    includeProductsTable: true,
    closingParagraph:
      'Our fulfillment team is now preparing your garments. You can track your order anytime using Order #{{order_number}}. For assistance, call us at {{store_phone}}.',
    accentColor: '#0c0a09',
  };

  const paymentVerifiedPlain: EmailTemplateConfig['plainEnglish'] = {
    heading: 'Payment Verified Successfully',
    greeting: 'Hi {{user_name}},',
    openingParagraph:
      'Great news! Your {{payment_method}} payment of {{grand_total}} (Transaction ID: {{trx_id}}) for Order #{{order_number}} placed on {{order_date}} has been verified.',
    bodyMessage:
      'Verified TrxID: {{trx_id}} | Amount Credited: {{grand_total}}\nItems Unlocked for Packing: {{products}}',
    includeOrderDetailsBox: true,
    includeProductsTable: true,
    closingParagraph:
      'Your order status has advanced to Processing. We will send you another notification with your courier tracking code as soon as your parcel is dispatched.',
    accentColor: '#065f46',
  };

  const paymentRejectedPlain: EmailTemplateConfig['plainEnglish'] = {
    heading: 'Payment Verification Action Required',
    greeting: 'Hi {{user_name}},',
    openingParagraph:
      'Our accounts desk reviewed the payment claim (TrxID: {{trx_id}}) submitted for Order #{{order_number}} placed on {{order_date}}, but could not match it in our statement.',
    bodyMessage:
      'Submitted TrxID: {{trx_id}} | Sender Phone: {{sender_phone}} | Claimed Amount: {{grand_total}}\nOrdered Products: {{products}}',
    includeOrderDetailsBox: true,
    includeProductsTable: false,
    closingParagraph:
      'Please sign in to your Customer Portal to submit the correct Transaction ID (TrxID), or reach our support desk at {{store_phone}}.',
    accentColor: '#991b1b',
  };

  const orderShippedPlain: EmailTemplateConfig['plainEnglish'] = {
    heading: 'Your Package Has Been Dispatched',
    greeting: 'Hi {{user_name}},',
    openingParagraph:
      'Your order #{{order_number}} (placed on {{order_date}}) containing {{products}} has passed quality control and been handed over to {{carrier_name}}!',
    bodyMessage:
      'Courier Carrier: {{carrier_name}}\nTracking Number: {{tracking_number}}\nDelivery Address: {{delivery_address}} ({{delivery_zone}})',
    includeOrderDetailsBox: true,
    includeProductsTable: true,
    closingParagraph:
      'Please keep {{grand_total}} ready if your order is Cash on Delivery. Use tracking code {{tracking_number}} on our Track Order page for live updates.',
    accentColor: '#1e40af',
  };

  const welcomePlain: EmailTemplateConfig['plainEnglish'] = {
    heading: 'Welcome to the Studio (+100 Loyalty Points)',
    greeting: 'Welcome, {{user_name}}!',
    openingParagraph:
      'Thank you for creating an account with {{store_name}} on {{order_date}}. We have credited 100 Welcome Loyalty Points to your profile ({{user_email}}).',
    bodyMessage:
      'Current Loyalty Balance: {{loyalty_points}} Points\nRedeem your points directly at checkout for instant discounts on all 240 GSM heavyweight apparel.',
    includeOrderDetailsBox: false,
    includeProductsTable: false,
    closingParagraph:
      'Explore our latest drop anytime. If you need sizing advice, reply to this email or call {{store_phone}}.',
    accentColor: '#0c0a09',
  };

  const adminAlertPlain: EmailTemplateConfig['plainEnglish'] = {
    heading: 'New Customer Order Alert',
    greeting: 'Hello Admin,',
    openingParagraph:
      'Customer {{user_name}} ({{user_phone}} / {{user_email}}) placed Order #{{order_number}} on {{order_date}} totaling {{grand_total}}.',
    bodyMessage:
      'Payment Method: {{payment_method}} ({{payment_status}})\nTransaction ID (TrxID): {{trx_id}} from {{sender_phone}}\nOrdered Products: {{products}}',
    includeOrderDetailsBox: true,
    includeProductsTable: true,
    closingParagraph:
      'Log in to the Admin Dashboard to verify the payment TrxID and dispatch the shipment.',
    accentColor: '#be123c',
  };

  const testPlain: EmailTemplateConfig['plainEnglish'] = {
    heading: 'SMTP Handshake & Template Test',
    greeting: 'Hello {{user_name}},',
    openingParagraph:
      'This is a live test email from {{store_name}} verifying that dynamic database fields (Order #{{order_number}}, TrxID {{trx_id}}, Date {{order_date}}, Products: {{products}}) populate accurately.',
    bodyMessage:
      'Sample Bound Order: #{{order_number}} | TrxID: {{trx_id}} | Total: {{grand_total}}',
    includeOrderDetailsBox: true,
    includeProductsTable: false,
    closingParagraph:
      'All transactional SMTP pipelines and custom template variables are operating normally.',
    accentColor: '#047857',
  };

  return {
    order_confirmation: {
      type: 'order_confirmation',
      name: 'Order Confirmation',
      editorMode: 'plain_english',
      subjectTemplate: 'Order Confirmed: #{{order_number}} ({{products}}) — {{store_name}}',
      plainEnglish: orderConfirmationPlain,
      customHtmlTemplate: buildDefaultHtmlFromPlain(orderConfirmationPlain),
      updatedAt: now,
    },
    payment_verified: {
      type: 'payment_verified',
      name: 'Payment Verified',
      editorMode: 'plain_english',
      subjectTemplate: 'Payment Verified (TrxID: {{trx_id}}) for Order #{{order_number}} — {{store_name}}',
      plainEnglish: paymentVerifiedPlain,
      customHtmlTemplate: buildDefaultHtmlFromPlain(paymentVerifiedPlain),
      updatedAt: now,
    },
    payment_rejected: {
      type: 'payment_rejected',
      name: 'Payment Rejected',
      editorMode: 'plain_english',
      subjectTemplate: 'Payment Action Needed: Order #{{order_number}} (TrxID: {{trx_id}}) — {{store_name}}',
      plainEnglish: paymentRejectedPlain,
      customHtmlTemplate: buildDefaultHtmlFromPlain(paymentRejectedPlain, true),
      updatedAt: now,
    },
    order_shipped: {
      type: 'order_shipped',
      name: 'Courier Dispatched',
      editorMode: 'plain_english',
      subjectTemplate: 'Order #{{order_number}} Shipped via {{carrier_name}} ({{tracking_number}})',
      plainEnglish: orderShippedPlain,
      customHtmlTemplate: buildDefaultHtmlFromPlain(orderShippedPlain),
      updatedAt: now,
    },
    welcome: {
      type: 'welcome',
      name: 'Welcome Bonus',
      editorMode: 'plain_english',
      subjectTemplate: 'Welcome to {{store_name}}, {{user_name}}! (+100 Loyalty Points)',
      plainEnglish: welcomePlain,
      customHtmlTemplate: buildDefaultHtmlFromPlain(welcomePlain),
      updatedAt: now,
    },
    admin_alert: {
      type: 'admin_alert',
      name: 'Admin New Order Alert',
      editorMode: 'plain_english',
      subjectTemplate: '[New Order #{{order_number}}] {{user_name}} — {{grand_total}} (TrxID: {{trx_id}})',
      plainEnglish: adminAlertPlain,
      customHtmlTemplate: buildDefaultHtmlFromPlain(adminAlertPlain),
      updatedAt: now,
    },
    test: {
      type: 'test',
      name: 'SMTP Handshake Test',
      editorMode: 'plain_english',
      subjectTemplate: '[SMTP Test] {{store_name}} — Sample Order #{{order_number}}',
      plainEnglish: testPlain,
      customHtmlTemplate: buildDefaultHtmlFromPlain(testPlain),
      updatedAt: now,
    },
  };
};

export const compilePlainEnglishToHtml = (template: EmailTemplateConfig): string => {
  return buildDefaultHtmlFromPlain(
    template.plainEnglish,
    template.type === 'payment_rejected'
  );
};

export const buildDatabaseVariableMap = (data: {
  order?: Order;
  user?: User;
  siteSettings: SiteSettings;
  rejectionReason?: string;
  testNote?: string;
}): Record<string, string> => {
  const { order, user, siteSettings, rejectionReason, testNote } = data;
  const currency = siteSettings.currencySymbol || '৳';
  const storeName = siteSettings.siteName || 'ThreadCraft Studio';

  const resolvedUserName = order?.customerName || user?.name || 'Valued Customer';
  const resolvedUserEmail = order?.customerEmail || user?.email || 'customer@example.com';
  const resolvedUserPhone = order?.customerPhone || user?.phone || '01700-000000';
  const resolvedOrderNumber = order?.orderNumber || 'ORD-2026-1042';
  const resolvedOrderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  const resolvedTrxId =
    order?.paymentClaim?.transactionId ||
    (order?.paymentMethodSnapshot.type === 'cod' ? 'COD (Cash on Delivery)' : 'BK98A4201X');
  const resolvedSenderPhone =
    order?.paymentClaim?.senderPhone || order?.customerPhone || resolvedUserPhone;
  const resolvedPaymentMethod = order?.paymentMethodSnapshot.name || 'bKash (Merchant)';
  const resolvedPaymentStatus = order?.paymentStatus || 'verified';
  const resolvedDeliveryZone = order?.deliveryZoneSnapshot.name || 'Inside Dhaka Metro';
  const resolvedDeliveryFee = `${currency}${order?.deliveryFee ?? 60}`;
  const resolvedDeliveryAddress = order
    ? `${order.deliveryAddressSnapshot.addressLine}, ${order.deliveryAddressSnapshot.areaName}, ${order.deliveryAddressSnapshot.district}`
    : 'House 12, Road 5, Dhanmondi, Dhaka';
  const resolvedSubtotal = `${currency}${order?.subtotal ?? 1780}`;
  const resolvedGrandTotal = `${currency}${order?.grandTotal ?? 1840}`;
  const resolvedCarrierName = order?.carrierName || 'Steadfast Courier';
  const resolvedTrackingNumber = order?.trackingNumber || 'SFC-8942110';
  const resolvedLoyaltyPoints = String(user?.loyaltyPoints ?? 100);

  const resolvedProductsText =
    order && order.items.length > 0
      ? order.items
          .map(i => `${i.productName} (${i.colorName} · Size ${i.size} × ${i.quantity})`)
          .join(', ')
      : 'Heavyweight Boxy Tee (Jet Black · Size L × 1)';

  const itemsRowsHtml =
    order && order.items.length > 0
      ? order.items
          .map(
            item => `
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e7e5e4; font-size: 12px; color: #1c1917;">
              <strong>${item.productName}</strong><br/>
              <span style="color: #78716c; font-size: 11px;">Color: ${item.colorName} | Size: ${item.size} | SKU: ${item.sku}</span>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e7e5e4; font-size: 12px; text-align: center; color: #44403c;">${item.quantity}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e7e5e4; font-size: 12px; text-align: right; font-weight: bold; color: #1c1917;">${currency}${item.lineTotal}</td>
          </tr>`
          )
          .join('')
      : `
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e7e5e4; font-size: 12px; color: #1c1917;">
              <strong>Heavyweight 240 GSM Boxy Tee</strong><br/>
              <span style="color: #78716c; font-size: 11px;">Color: Jet Black | Size: L | SKU: TC-240-BLK-L</span>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e7e5e4; font-size: 12px; text-align: center; color: #44403c;">1</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e7e5e4; font-size: 12px; text-align: right; font-weight: bold; color: #1c1917;">${currency}1780</td>
          </tr>`;

  const resolvedProductsTableHtml = `
    <div style="margin: 18px 0;">
      <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #1c1917; margin: 0 0 8px 0;">Ordered Products (From Database)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #e7e5e4;">
        <thead>
          <tr style="background-color: #f5f5f4; font-size: 11px; text-transform: uppercase; color: #78716c;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>
      <div style="text-align: right; font-size: 12px; color: #44403c;">
        <div>Subtotal: <strong>${resolvedSubtotal}</strong> · Delivery (${resolvedDeliveryZone}): <strong>${resolvedDeliveryFee}</strong></div>
        <div style="font-size: 15px; font-weight: 900; color: #0c0a09; margin-top: 4px;">Grand Total: ${resolvedGrandTotal}</div>
      </div>
    </div>
  `;

  const resolvedOrderDetailsBoxHtml = `
    <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 6px; padding: 14px; margin: 16px 0;">
      <table style="width: 100%; font-size: 12px; color: #44403c; border-collapse: collapse;">
        <tr><td style="padding: 3px 0;"><strong>Order Number:</strong></td><td style="text-align: right; font-family: monospace; font-weight: bold; color: #0c0a09;">#${resolvedOrderNumber}</td></tr>
        <tr><td style="padding: 3px 0;"><strong>Order Date:</strong></td><td style="text-align: right;">${resolvedOrderDate}</td></tr>
        <tr><td style="padding: 3px 0;"><strong>Customer Name:</strong></td><td style="text-align: right; font-weight: bold; color: #1c1917;">${resolvedUserName}</td></tr>
        <tr><td style="padding: 3px 0;"><strong>Payment Method:</strong></td><td style="text-align: right;">${resolvedPaymentMethod}</td></tr>
        <tr><td style="padding: 3px 0;"><strong>Transaction ID (TrxID):</strong></td><td style="text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">${resolvedTrxId}</td></tr>
        <tr><td style="padding: 3px 0;"><strong>Delivery Zone:</strong></td><td style="text-align: right;">${resolvedDeliveryZone} (${resolvedDeliveryFee})</td></tr>
      </table>
    </div>
  `;

  return {
    user_name: resolvedUserName,
    customer_name: resolvedUserName,
    username: resolvedUserName,
    user_email: resolvedUserEmail,
    customer_email: resolvedUserEmail,
    user_phone: resolvedUserPhone,
    customer_phone: resolvedUserPhone,
    order_number: resolvedOrderNumber,
    order_id: resolvedOrderNumber,
    order_date: resolvedOrderDate,
    date: resolvedOrderDate,
    trx_id: resolvedTrxId,
    tranx_id: resolvedTrxId,
    transaction_id: resolvedTrxId,
    sender_phone: resolvedSenderPhone,
    payment_method: resolvedPaymentMethod,
    payment_status: resolvedPaymentStatus,
    products: resolvedProductsText,
    product: resolvedProductsText,
    product_names: resolvedProductsText,
    products_table: resolvedProductsTableHtml,
    order_details_box: resolvedOrderDetailsBoxHtml,
    subtotal: resolvedSubtotal,
    delivery_fee: resolvedDeliveryFee,
    delivery_zone: resolvedDeliveryZone,
    delivery_address: resolvedDeliveryAddress,
    grand_total: resolvedGrandTotal,
    total_amount: resolvedGrandTotal,
    total: resolvedGrandTotal,
    carrier_name: resolvedCarrierName,
    tracking_number: resolvedTrackingNumber,
    loyalty_points: resolvedLoyaltyPoints,
    rejection_reason: rejectionReason || 'Transaction ID could not be matched in statement.',
    test_note: testNote || 'All transactional SMTP email pipelines are operating nominally.',
    store_name: storeName,
    store_logo_text: siteSettings.logoText || 'THREADCRAFT',
    store_phone: siteSettings.contact.phone,
    store_email: siteSettings.contact.email,
    store_address: siteSettings.contact.address,
  };
};

export const interpolateTemplateString = (
  rawTemplate: string,
  variables: Record<string, string>
): string => {
  if (!rawTemplate) return '';
  let result = rawTemplate;

  // 1. Replace {{variable_name}} and {variable_name}
  result = result.replace(/\{\{\s*([a-zA-Z0-9_ ]+)\s*\}\}/g, (_, key) => {
    const normalized = key.trim().toLowerCase().replace(/\s+/g, '_');
    return variables[normalized] !== undefined ? variables[normalized] : `{{${key}}}`;
  });

  // 2. Also support natural plain-English bracket placeholders like [trx id], [tranx id], [user name], [date], [order number], [product]
  result = result.replace(/\[\s*([a-zA-Z0-9_ ]+)\s*\]/g, (fullMatch, key) => {
    const normalized = key.trim().toLowerCase().replace(/\s+/g, '_');
    if (variables[normalized] !== undefined) {
      return variables[normalized];
    }
    return fullMatch;
  });

  return result;
};

export const generateEmailHtml = (
  type: EmailType,
  data: {
    order?: Order;
    user?: User;
    siteSettings: SiteSettings;
    rejectionReason?: string;
    testNote?: string;
    templateConfig?: EmailTemplateConfig;
  }
): { subject: string; html: string } => {
  const defaultTemplates = getInitialEmailTemplates();
  const activeTemplate = data.templateConfig || defaultTemplates[type] || defaultTemplates.test;
  const variableMap = buildDatabaseVariableMap(data);

  const rawHtmlToRender =
    activeTemplate.editorMode === 'custom_html'
      ? activeTemplate.customHtmlTemplate
      : compilePlainEnglishToHtml(activeTemplate);

  const subject = interpolateTemplateString(activeTemplate.subjectTemplate, variableMap);
  const html = interpolateTemplateString(rawHtmlToRender, variableMap);

  return { subject, html };
};

