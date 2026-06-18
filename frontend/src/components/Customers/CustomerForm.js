import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomerForm = ({ customer, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    // Basic Info
    name: '', email: '', customerType: 'Individual', salutation: 'Mr',
    firstName: '', lastName: '', companyName: '', displayName: '', currency: 'EUR',
    // Phone Fields with Country Codes
    phoneCountryCode: '+49', phone: '',
    workPhoneCountryCode: '+49', workPhone: '',
    mobileCountryCode: '+49', mobile: '',
    paymentTerms: 'Due on Receipt', portalAccess: false, portalLanguages: ['English'],
    // Billing Address
    billingAddress: '', billingCountry: 'Germany', billingState: '', billingCity: '', billingPin: '',
    billingPhone: '', billingFax: '',
    // Shipping Address
    shippingAddress: '', shippingCountry: 'Germany', shippingState: '', shippingCity: '', shippingPin: '',
    shippingPhone: '', shippingFax: '',
    // Contact
    contactEmail: '', remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        customerType: customer.customerType || 'Individual',
        salutation: customer.salutation || 'Mr',
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        companyName: customer.companyName || '',
        displayName: customer.displayName || '',
        currency: customer.currency || 'EUR',
        phoneCountryCode: customer.phoneCountryCode || '+49',
        phone: customer.phone || '',
        workPhoneCountryCode: customer.workPhoneCountryCode || '+49',
        workPhone: customer.workPhone || '',
        mobileCountryCode: customer.mobileCountryCode || '+49',
        mobile: customer.mobile || '',
        paymentTerms: customer.paymentTerms || 'Due on Receipt',
        portalAccess: customer.portalAccess || false,
        portalLanguages: customer.portalLanguages || ['English'],
        billingAddress: customer.billingAddress || '',
        billingCountry: customer.billingCountry || 'Germany',
        billingState: customer.billingState || '',
        billingCity: customer.billingCity || '',
        billingPin: customer.billingPin || '',
        billingPhone: customer.billingPhone || '',
        billingFax: customer.billingFax || '',
        shippingAddress: customer.shippingAddress || '',
        shippingCountry: customer.shippingCountry || 'Germany',
        shippingState: customer.shippingState || '',
        shippingCity: customer.shippingCity || '',
        shippingPin: customer.shippingPin || '',
        shippingPhone: customer.shippingPhone || '',
        shippingFax: customer.shippingFax || '',
        contactEmail: customer.contactEmail || '',
        remarks: customer.remarks || ''
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Ensure name is set
    let submitData = { ...formData };
    if (!submitData.name) {
      if (submitData.firstName || submitData.lastName) {
        submitData.name = `${submitData.firstName || ''} ${submitData.lastName || ''}`.trim();
      } else if (submitData.companyName) {
        submitData.name = submitData.companyName;
      } else if (submitData.email) {
        submitData.name = submitData.email.split('@')[0];
      } else {
        setError('Customer name or email is required');
        setLoading(false);
        return;
      }
    }
    
    // Set display name
    if (!submitData.displayName && (submitData.firstName || submitData.lastName)) {
      submitData.displayName = `${submitData.salutation || ''} ${submitData.firstName || ''} ${submitData.lastName || ''}`.trim();
    }
    
    try {
      const token = localStorage.getItem('token');
      let response;
      if (customer) {
        response = await axios.put(`/customers/${customer._id}`, submitData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
      } else {
        response = await axios.post('/customers', submitData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
      }
      
      if (response.data.success) {
        setSuccess(customer ? 'Customer updated successfully!' : 'Customer created successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving customer');
    } finally {
      setLoading(false);
    }
  };

  // Country code options for dropdown with country names
  const countryCodes = [
    { code: '+1', country: 'USA/Canada' },
    { code: '+7', country: 'Russia' },
    { code: '+20', country: 'Egypt' },
    { code: '+27', country: 'South Africa' },
    { code: '+31', country: 'Netherlands' },
    { code: '+32', country: 'Belgium' },
    { code: '+33', country: 'France' },
    { code: '+34', country: 'Spain' },
    { code: '+36', country: 'Hungary' },
    { code: '+39', country: 'Italy' },
    { code: '+40', country: 'Romania' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+45', country: 'Denmark' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+48', country: 'Poland' },
    { code: '+49', country: 'Germany' },
    { code: '+51', country: 'Peru' },
    { code: '+52', country: 'Mexico' },
    { code: '+53', country: 'Cuba' },
    { code: '+54', country: 'Argentina' },
    { code: '+55', country: 'Brazil' },
    { code: '+56', country: 'Chile' },
    { code: '+57', country: 'Colombia' },
    { code: '+58', country: 'Venezuela' },
    { code: '+60', country: 'Malaysia' },
    { code: '+61', country: 'Australia' },
    { code: '+62', country: 'Indonesia' },
    { code: '+63', country: 'Philippines' },
    { code: '+64', country: 'New Zealand' },
    { code: '+65', country: 'Singapore' },
    { code: '+66', country: 'Thailand' },
    { code: '+81', country: 'Japan' },
    { code: '+82', country: 'South Korea' },
    { code: '+84', country: 'Vietnam' },
    { code: '+86', country: 'China' },
    { code: '+90', country: 'Turkey' },
    { code: '+91', country: 'India' },
    { code: '+92', country: 'Pakistan' },
    { code: '+93', country: 'Afghanistan' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+95', country: 'Myanmar' },
    { code: '+98', country: 'Iran' },
    { code: '+211', country: 'South Sudan' },
    { code: '+212', country: 'Morocco' },
    { code: '+213', country: 'Algeria' },
    { code: '+216', country: 'Tunisia' },
    { code: '+218', country: 'Libya' },
    { code: '+220', country: 'Gambia' },
    { code: '+221', country: 'Senegal' },
    { code: '+222', country: 'Mauritania' },
    { code: '+223', country: 'Mali' },
    { code: '+224', country: 'Guinea' },
    { code: '+225', country: 'Ivory Coast' },
    { code: '+226', country: 'Burkina Faso' },
    { code: '+227', country: 'Niger' },
    { code: '+228', country: 'Togo' },
    { code: '+229', country: 'Benin' },
    { code: '+230', country: 'Mauritius' },
    { code: '+231', country: 'Liberia' },
    { code: '+232', country: 'Sierra Leone' },
    { code: '+233', country: 'Ghana' },
    { code: '+234', country: 'Nigeria' },
    { code: '+235', country: 'Chad' },
    { code: '+236', country: 'Central African Republic' },
    { code: '+237', country: 'Cameroon' },
    { code: '+238', country: 'Cape Verde' },
    { code: '+239', country: 'Sao Tome and Principe' },
    { code: '+240', country: 'Equatorial Guinea' },
    { code: '+241', country: 'Gabon' },
    { code: '+242', country: 'Congo' },
    { code: '+243', country: 'DR Congo' },
    { code: '+244', country: 'Angola' },
    { code: '+245', country: 'Guinea-Bissau' },
    { code: '+246', country: 'Diego Garcia' },
    { code: '+247', country: 'Ascension Island' },
    { code: '+248', country: 'Seychelles' },
    { code: '+249', country: 'Sudan' },
    { code: '+250', country: 'Rwanda' },
    { code: '+251', country: 'Ethiopia' },
    { code: '+252', country: 'Somalia' },
    { code: '+253', country: 'Djibouti' },
    { code: '+254', country: 'Kenya' },
    { code: '+255', country: 'Tanzania' },
    { code: '+256', country: 'Uganda' },
    { code: '+257', country: 'Burundi' },
    { code: '+258', country: 'Mozambique' },
    { code: '+260', country: 'Zambia' },
    { code: '+261', country: 'Madagascar' },
    { code: '+262', country: 'Reunion' },
    { code: '+263', country: 'Zimbabwe' },
    { code: '+264', country: 'Namibia' },
    { code: '+265', country: 'Malawi' },
    { code: '+266', country: 'Lesotho' },
    { code: '+267', country: 'Botswana' },
    { code: '+268', country: 'Eswatini' },
    { code: '+269', country: 'Comoros' },
    { code: '+290', country: 'Saint Helena' },
    { code: '+291', country: 'Eritrea' },
    { code: '+297', country: 'Aruba' },
    { code: '+298', country: 'Faroe Islands' },
    { code: '+299', country: 'Greenland' },
    { code: '+350', country: 'Gibraltar' },
    { code: '+351', country: 'Portugal' },
    { code: '+352', country: 'Luxembourg' },
    { code: '+353', country: 'Ireland' },
    { code: '+354', country: 'Iceland' },
    { code: '+355', country: 'Albania' },
    { code: '+356', country: 'Malta' },
    { code: '+357', country: 'Cyprus' },
    { code: '+358', country: 'Finland' },
    { code: '+359', country: 'Bulgaria' },
    { code: '+370', country: 'Lithuania' },
    { code: '+371', country: 'Latvia' },
    { code: '+372', country: 'Estonia' },
    { code: '+373', country: 'Moldova' },
    { code: '+374', country: 'Armenia' },
    { code: '+375', country: 'Belarus' },
    { code: '+376', country: 'Andorra' },
    { code: '+377', country: 'Monaco' },
    { code: '+378', country: 'San Marino' },
    { code: '+379', country: 'Vatican City' },
    { code: '+380', country: 'Ukraine' },
    { code: '+381', country: 'Serbia' },
    { code: '+382', country: 'Montenegro' },
    { code: '+383', country: 'Kosovo' },
    { code: '+385', country: 'Croatia' },
    { code: '+386', country: 'Slovenia' },
    { code: '+387', country: 'Bosnia' },
    { code: '+389', country: 'North Macedonia' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+421', country: 'Slovakia' },
    { code: '+423', country: 'Liechtenstein' },
    { code: '+500', country: 'Falkland Islands' },
    { code: '+501', country: 'Belize' },
    { code: '+502', country: 'Guatemala' },
    { code: '+503', country: 'El Salvador' },
    { code: '+504', country: 'Honduras' },
    { code: '+505', country: 'Nicaragua' },
    { code: '+506', country: 'Costa Rica' },
    { code: '+507', country: 'Panama' },
    { code: '+508', country: 'Saint Pierre' },
    { code: '+509', country: 'Haiti' },
    { code: '+590', country: 'Guadeloupe' },
    { code: '+591', country: 'Bolivia' },
    { code: '+592', country: 'Guyana' },
    { code: '+593', country: 'Ecuador' },
    { code: '+594', country: 'French Guiana' },
    { code: '+595', country: 'Paraguay' },
    { code: '+596', country: 'Martinique' },
    { code: '+597', country: 'Suriname' },
    { code: '+598', country: 'Uruguay' },
    { code: '+599', country: 'Curacao' },
    { code: '+670', country: 'Timor-Leste' },
    { code: '+672', country: 'Antarctica' },
    { code: '+673', country: 'Brunei' },
    { code: '+674', country: 'Nauru' },
    { code: '+675', country: 'Papua New Guinea' },
    { code: '+676', country: 'Tonga' },
    { code: '+677', country: 'Solomon Islands' },
    { code: '+678', country: 'Vanuatu' },
    { code: '+679', country: 'Fiji' },
    { code: '+680', country: 'Palau' },
    { code: '+681', country: 'Wallis and Futuna' },
    { code: '+682', country: 'Cook Islands' },
    { code: '+683', country: 'Niue' },
    { code: '+685', country: 'Samoa' },
    { code: '+686', country: 'Kiribati' },
    { code: '+687', country: 'New Caledonia' },
    { code: '+688', country: 'Tuvalu' },
    { code: '+689', country: 'French Polynesia' },
    { code: '+690', country: 'Tokelau' },
    { code: '+691', country: 'Micronesia' },
    { code: '+692', country: 'Marshall Islands' },
    { code: '+850', country: 'North Korea' },
    { code: '+852', country: 'Hong Kong' },
    { code: '+853', country: 'Macau' },
    { code: '+855', country: 'Cambodia' },
    { code: '+856', country: 'Laos' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+886', country: 'Taiwan' },
    { code: '+960', country: 'Maldives' },
    { code: '+961', country: 'Lebanon' },
    { code: '+962', country: 'Jordan' },
    { code: '+963', country: 'Syria' },
    { code: '+964', country: 'Iraq' },
    { code: '+965', country: 'Kuwait' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+967', country: 'Yemen' },
    { code: '+968', country: 'Oman' },
    { code: '+970', country: 'Palestine' },
    { code: '+971', country: 'UAE' },
    { code: '+972', country: 'Israel' },
    { code: '+973', country: 'Bahrain' },
    { code: '+974', country: 'Qatar' },
    { code: '+975', country: 'Bhutan' },
    { code: '+976', country: 'Mongolia' },
    { code: '+977', country: 'Nepal' },
    { code: '+992', country: 'Tajikistan' },
    { code: '+993', country: 'Turkmenistan' },
    { code: '+994', country: 'Azerbaijan' },
    { code: '+995', country: 'Georgia' },
    { code: '+996', country: 'Kyrgyzstan' },
    { code: '+998', country: 'Uzbekistan' }
  ];

  return (
    <div className="form-card">
      <h3 className="form-title">{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* Tabs */}
      <div className="tabs">
        <button type="button" className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>Basic Info</button>
        <button type="button" className={`tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => setActiveTab('phone')}>Contact Numbers</button>
        <button type="button" className={`tab ${activeTab === 'tax' ? 'active' : ''}`} onClick={() => setActiveTab('tax')}>Additional Details</button>
        <button type="button" className={`tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>Billing Address</button>
        <button type="button" className={`tab ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')}>Shipping Address</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Type</label>
                <select name="customerType" value={formData.customerType} onChange={handleChange}>
                  <option value="Business">Business</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>
              <div className="form-group">
                <label>Salutation</label>
                <select name="salutation" value={formData.salutation} onChange={handleChange}>
                  <option value="Mr">Mr</option>
                  <option value="Ms">Ms</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Company Name</label>
              <input name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company name (if business)" />
            </div>
            
            <div className="form-group">
              <label>Display Name</label>
              <input name="displayName" value={formData.displayName} onChange={handleChange} placeholder="Name shown on invoices" />
              <small style={{ color: '#666', fontSize: '11px' }}>Leave empty to auto-generate from first/last name</small>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="customer@example.com" required />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange}>
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                  <option value="AED">UAE Dirham (د.إ)</option>
                  <option value="SAR">Saudi Riyal (﷼)</option>
                </select>
              </div>
            </div>
          </>
        )}
        
        {/* Contact Numbers Tab - With Country Code Dropdowns */}
        {activeTab === 'phone' && (
          <>
            {/* Phone (Primary) */}
            <div className="form-group">
              <label>Phone (Primary)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select 
                  name="phoneCountryCode" 
                  value={formData.phoneCountryCode} 
                  onChange={handleChange}
                  style={{ width: '110px', padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }}
                >
                  {countryCodes.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                  ))}
                </select>
                <input 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="Phone number" 
                  style={{ flex: 1 }} 
                />
              </div>
              <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>Primary contact number</small>
            </div>

            {/* Work Phone */}
            <div className="form-group">
              <label>Work Phone</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select 
                  name="workPhoneCountryCode" 
                  value={formData.workPhoneCountryCode} 
                  onChange={handleChange}
                  style={{ width: '110px', padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }}
                >
                  {countryCodes.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                  ))}
                </select>
                <input 
                  name="workPhone" 
                  value={formData.workPhone} 
                  onChange={handleChange} 
                  placeholder="Work phone number" 
                  style={{ flex: 1 }} 
                />
              </div>
              <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>Office/Company phone number</small>
            </div>
            
            {/* Mobile */}
            <div className="form-group">
              <label>Mobile</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select 
                  name="mobileCountryCode" 
                  value={formData.mobileCountryCode} 
                  onChange={handleChange}
                  style={{ width: '110px', padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }}
                >
                  {countryCodes.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                  ))}
                </select>
                <input 
                  name="mobile" 
                  value={formData.mobile} 
                  onChange={handleChange} 
                  placeholder="Mobile number" 
                  style={{ flex: 1 }} 
                />
              </div>
              <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>Personal mobile number (for WhatsApp/SMS)</small>
            </div>
            
            {/* Contact Email */}
            <div className="form-group">
              <label>Contact Email</label>
              <input 
                name="contactEmail" 
                type="email" 
                value={formData.contactEmail} 
                onChange={handleChange} 
                placeholder="Alternate email address" 
              />
              <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>For sending invoice copies (if different from primary email)</small>
            </div>
          </>
        )}
        
        {/* Additional Details Tab */}
        {activeTab === 'tax' && (
          <>
            <div className="form-group">
              <label>Payment Terms</label>
              <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange}>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>
                <input type="checkbox" name="portalAccess" checked={formData.portalAccess} onChange={handleChange} />
                Enable portal access for this customer
              </label>
              <small style={{ color: '#666', fontSize: '11px', display: 'block', marginTop: '4px' }}>Customer can view invoices online</small>
            </div>
          </>
        )}
        
        {/* Billing Address Tab */}
        {activeTab === 'billing' && (
          <>
            <div className="form-group">
              <label>Billing Address</label>
              <textarea name="billingAddress" value={formData.billingAddress} onChange={handleChange} rows="2" placeholder="Street address, building, apartment" />
              <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>Use German address order: street name and house number, postal code, city.</small>
            </div>
            <div className="form-row">
              <div className="form-group"><label>City</label><input name="billingCity" value={formData.billingCity} onChange={handleChange} placeholder="City" /></div>
              <div className="form-group"><label>State</label><input name="billingState" value={formData.billingState} onChange={handleChange} placeholder="State/Province" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Postal Code</label><input name="billingPin" value={formData.billingPin} onChange={handleChange} placeholder="Postal code" /></div>
              <div className="form-group"><label>Country</label><input name="billingCountry" value={formData.billingCountry} onChange={handleChange} placeholder="Country" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input name="billingPhone" value={formData.billingPhone} onChange={handleChange} placeholder="Billing contact phone" /></div>
              <div className="form-group"><label>Fax</label><input name="billingFax" value={formData.billingFax} onChange={handleChange} placeholder="Fax number" /></div>
            </div>
          </>
        )}
        
        {/* Shipping Address Tab */}
        {activeTab === 'shipping' && (
          <>
            <div className="form-group">
              <label>Shipping Address</label>
              <textarea name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} rows="2" placeholder="Street address, building, apartment" />
            </div>
            <div className="form-row">
              <div className="form-group"><label>City</label><input name="shippingCity" value={formData.shippingCity} onChange={handleChange} placeholder="City" /></div>
              <div className="form-group"><label>State</label><input name="shippingState" value={formData.shippingState} onChange={handleChange} placeholder="State/Province" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Postal Code</label><input name="shippingPin" value={formData.shippingPin} onChange={handleChange} placeholder="Postal code" /></div>
              <div className="form-group"><label>Country</label><input name="shippingCountry" value={formData.shippingCountry} onChange={handleChange} placeholder="Country" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input name="shippingPhone" value={formData.shippingPhone} onChange={handleChange} placeholder="Shipping contact phone" /></div>
              <div className="form-group"><label>Fax</label><input name="shippingFax" value={formData.shippingFax} onChange={handleChange} placeholder="Fax number" /></div>
            </div>
          </>
        )}
        
        {/* Remarks */}
        <div className="form-group">
          <label>Remarks</label>
          <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" placeholder="Additional notes, special instructions, etc." />
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;