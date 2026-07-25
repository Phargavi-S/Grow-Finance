import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import PasswordInput from '../Common/PasswordInput';
import { useToast } from '../Common/Toast';
import {
  FiBriefcase, FiCreditCard, FiFileText, FiUser, FiImage,
  FiSave, FiX, FiUpload
} from 'react-icons/fi';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'INR', 'CAD', 'AUD'];
const PAYMENT_TERMS = [
  'Due on Receipt',
  'Net 7',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60'
];

const defaultFormState = () => ({
  company: {
    logo: '',
    name: '',
    email: '',
    phone: '',
    website: '',
    taxVatNumber: '',
    registrationNumber: '',
    businessAddress: ''
  },
  bank: {
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    iban: '',
    swiftBic: '',
    branchName: '',
    currency: 'EUR'
  },
  invoicePreferences: {
    defaultCurrency: 'EUR',
    paymentTerms: 'Due on Receipt',
    invoicePrefix: 'INV',
    invoiceNotes: '',
    companySignature: ''
  },
  userProfile: {
    fullName: '',
    email: '',
    profilePhoto: ''
  },
  branding: {
    companyLogo: '',
    themeColor: '#b2ff59'
  },
  password: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
});

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const SettingsCard = ({ icon, title, description, children }) => (
  <section className="settings-card">
    <div className="settings-card-header">
      <div className="settings-card-icon">{icon}</div>
      <div>
        <h2 className="settings-card-title">{title}</h2>
        {description && <p className="settings-card-desc">{description}</p>}
      </div>
    </div>
    <div className="settings-card-body">{children}</div>
  </section>
);

const ImageUploadField = ({ label, value, onChange, hint }) => {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return;
    const dataUrl = await readFileAsDataUrl(file);
    onChange(dataUrl);
  };

  return (
    <div className="form-group settings-upload-group">
      <label>{label}</label>
      <div className="settings-upload-row">
        {value ? (
          <img src={value} alt={label} className="settings-upload-preview" />
        ) : (
          <div className="settings-upload-placeholder">
            <FiImage />
            <span>No image</span>
          </div>
        )}
        <div className="settings-upload-actions">
          <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
            <FiUpload /> Upload
          </button>
          {value && (
            <button type="button" className="btn-secondary" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
      </div>
      {hint && <span className="settings-field-hint">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="settings-file-input"
        onChange={handleFile}
      />
    </div>
  );
};

const ProfileSettings = ({ onLogout, user }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState(defaultFormState);
  const [initialData, setInitialData] = useState(defaultFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/profile', { withCredentials: true });
        if (res.data.success) {
          const { profile } = res.data;
          const loaded = {
            ...defaultFormState(),
            company: profile.company,
            bank: profile.bank,
            invoicePreferences: profile.invoicePreferences,
            userProfile: {
              fullName: profile.userProfile.fullName || profile.user?.fullName || '',
              email: profile.userProfile.email || profile.user?.email || '',
              profilePhoto: profile.userProfile.profilePhoto || ''
            },
            branding: profile.branding,
            password: { currentPassword: '', newPassword: '', confirmPassword: '' }
          };
          setFormData(loaded);
          setInitialData(loaded);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load profile settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const updateSection = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    setErrors((prev) => ({ ...prev, [`${section}.${field}`]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.company.name.trim()) {
      nextErrors['company.name'] = 'Company name is required';
    }
    if (!formData.userProfile.fullName.trim()) {
      nextErrors['userProfile.fullName'] = 'Name is required';
    }
    if (formData.company.website && !/^https?:\/\/.+/i.test(formData.company.website)) {
      nextErrors['company.website'] = 'Website must start with http:// or https://';
    }
    const { currentPassword, newPassword, confirmPassword } = formData.password;
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) nextErrors['password.current'] = 'Current password is required';
      if (!newPassword) nextErrors['password.new'] = 'New password is required';
      else if (newPassword.length < 8) nextErrors['password.new'] = 'Password must be at least 8 characters';
      else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        nextErrors['password.new'] = 'Password must contain a letter and a number';
      }
      if (newPassword !== confirmPassword) nextErrors['password.confirm'] = 'Passwords do not match';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setSaving(true);
    try {
      const logo = formData.branding.companyLogo || formData.company.logo;
      const payload = {
        company: { ...formData.company, logo },
        bank: formData.bank,
        invoicePreferences: formData.invoicePreferences,
        userProfile: {
          fullName: formData.userProfile.fullName,
          profilePhoto: formData.userProfile.profilePhoto
        },
        branding: { ...formData.branding, companyLogo: logo }
      };

      const res = await axios.put('/profile', payload, { withCredentials: true });

      const { currentPassword, newPassword } = formData.password;
      if (currentPassword && newPassword) {
        await axios.post('/auth/change-password', {
          currentPassword,
          newPassword
        }, { withCredentials: true });
      }

      if (res.data.success) {
        const loaded = {
          ...formData,
          company: res.data.profile.company,
          bank: res.data.profile.bank,
          invoicePreferences: res.data.profile.invoicePreferences,
          userProfile: {
            ...formData.userProfile,
            fullName: res.data.profile.userProfile.fullName,
            email: res.data.profile.userProfile.email,
            profilePhoto: res.data.profile.userProfile.profilePhoto
          },
          branding: res.data.profile.branding,
          password: { currentPassword: '', newPassword: '', confirmPassword: '' }
        };
        setFormData(loaded);
        setInitialData(loaded);
        showToast('Profile settings saved successfully', 'success');
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to save profile settings';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ...initialData,
      password: { currentPassword: '', newPassword: '', confirmPassword: '' }
    });
    setErrors({});
    showToast('Changes discarded', 'info');
  };

  const handleLogoChange = (dataUrl) => {
    updateSection('company', 'logo', dataUrl);
    updateSection('branding', 'companyLogo', dataUrl);
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header onLogout={onLogout} user={user} />
          <div className="content-area dashboard-loading">
            <div className="loading-spinner" />
            <p>Loading profile settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <div>
              <h1 className="page-title">Profile Settings</h1>
              <p className="page-subtitle">Manage your company, banking, invoice, and account preferences</p>
            </div>
          </div>

          <form className="settings-page" onSubmit={handleSave}>
            <SettingsCard
              icon={<FiBriefcase />}
              title="Company Information"
              description="Your business details used across the platform"
            >
              <div className="settings-grid">
                <div className="settings-grid-full">
                  <ImageUploadField
                    label="Company Logo"
                    value={formData.company.logo || formData.branding.companyLogo}
                    onChange={handleLogoChange}
                    hint="PNG or JPG, max 2 MB"
                  />
                </div>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    value={formData.company.name}
                    onChange={(e) => updateSection('company', 'name', e.target.value)}
                  />
                  {errors['company.name'] && <span className="form-error">{errors['company.name']}</span>}
                </div>
                <div className="form-group">
                  <label>Company Email</label>
                  <input
                    type="text"
                    value={formData.company.email}
                    onChange={(e) => updateSection('company', 'email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={formData.company.phone}
                    onChange={(e) => updateSection('company', 'phone', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.company.website}
                    onChange={(e) => updateSection('company', 'website', e.target.value)}
                  />
                  {errors['company.website'] && <span className="form-error">{errors['company.website']}</span>}
                </div>
                <div className="form-group">
                  <label>Tax/VAT Number</label>
                  <input
                    type="text"
                    value={formData.company.taxVatNumber}
                    onChange={(e) => updateSection('company', 'taxVatNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Registration Number</label>
                  <input
                    type="text"
                    value={formData.company.registrationNumber}
                    onChange={(e) => updateSection('company', 'registrationNumber', e.target.value)}
                  />
                </div>
                <div className="form-group settings-grid-full">
                  <label>Business Address</label>
                  <textarea
                    rows={3}
                    value={formData.company.businessAddress}
                    onChange={(e) => updateSection('company', 'businessAddress', e.target.value)}
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<FiCreditCard />}
              title="Bank Details"
              description="Banking information for payments and invoicing"
            >
              <div className="settings-grid">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank.bankName}
                    onChange={(e) => updateSection('bank', 'bankName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.bank.accountHolderName}
                    onChange={(e) => updateSection('bank', 'accountHolderName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={formData.bank.accountNumber}
                    onChange={(e) => updateSection('bank', 'accountNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>IBAN</label>
                  <input
                    type="text"
                    value={formData.bank.iban}
                    onChange={(e) => updateSection('bank', 'iban', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>SWIFT/BIC</label>
                  <input
                    type="text"
                    value={formData.bank.swiftBic}
                    onChange={(e) => updateSection('bank', 'swiftBic', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    value={formData.bank.branchName}
                    onChange={(e) => updateSection('bank', 'branchName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={formData.bank.currency}
                    onChange={(e) => updateSection('bank', 'currency', e.target.value)}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<FiFileText />}
              title="Invoice Preferences"
              description="Default settings for new invoices"
            >
              <div className="settings-grid">
                <div className="form-group">
                  <label>Default Currency</label>
                  <select
                    value={formData.invoicePreferences.defaultCurrency}
                    onChange={(e) => updateSection('invoicePreferences', 'defaultCurrency', e.target.value)}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <select
                    value={formData.invoicePreferences.paymentTerms}
                    onChange={(e) => updateSection('invoicePreferences', 'paymentTerms', e.target.value)}
                  >
                    {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Invoice Prefix</label>
                  <input
                    type="text"
                    value={formData.invoicePreferences.invoicePrefix}
                    onChange={(e) => updateSection('invoicePreferences', 'invoicePrefix', e.target.value)}
                  />
                </div>
                <div className="form-group settings-grid-full">
                  <label>Invoice Notes</label>
                  <textarea
                    rows={3}
                    value={formData.invoicePreferences.invoiceNotes}
                    onChange={(e) => updateSection('invoicePreferences', 'invoiceNotes', e.target.value)}
                  />
                </div>
                <div className="settings-grid-full">
                  <ImageUploadField
                    label="Company Signature (optional)"
                    value={formData.invoicePreferences.companySignature}
                    onChange={(v) => updateSection('invoicePreferences', 'companySignature', v)}
                    hint="Optional signature image for invoices"
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<FiUser />}
              title="User Profile"
              description="Your personal account information"
            >
              <div className="settings-grid">
                <div className="settings-grid-full">
                  <ImageUploadField
                    label="Profile Photo (optional)"
                    value={formData.userProfile.profilePhoto}
                    onChange={(v) => updateSection('userProfile', 'profilePhoto', v)}
                  />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.userProfile.fullName}
                    onChange={(e) => updateSection('userProfile', 'fullName', e.target.value)}
                  />
                  {errors['userProfile.fullName'] && <span className="form-error">{errors['userProfile.fullName']}</span>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="text" value={formData.userProfile.email} disabled />
                </div>
                <div className="form-group">
                  <label>Current Password</label>
                  <PasswordInput
                    value={formData.password.currentPassword}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      password: { ...prev.password, currentPassword: e.target.value }
                    }))}
                    placeholder="Enter current password"
                  />
                  {errors['password.current'] && <span className="form-error">{errors['password.current']}</span>}
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <PasswordInput
                    value={formData.password.newPassword}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      password: { ...prev.password, newPassword: e.target.value }
                    }))}
                    placeholder="Enter new password"
                  />
                  {errors['password.new'] && <span className="form-error">{errors['password.new']}</span>}
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <PasswordInput
                    value={formData.password.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      password: { ...prev.password, confirmPassword: e.target.value }
                    }))}
                    placeholder="Confirm new password"
                  />
                  {errors['password.confirm'] && <span className="form-error">{errors['password.confirm']}</span>}
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<FiImage />}
              title="Branding"
              description="Customize your company appearance"
            >
              <div className="settings-grid">
                <div className="settings-grid-full">
                  <ImageUploadField
                    label="Company Logo"
                    value={formData.branding.companyLogo || formData.company.logo}
                    onChange={handleLogoChange}
                  />
                </div>
                <div className="form-group">
                  <label>Company Theme Color (optional)</label>
                  <div className="settings-color-row">
                    <input
                      type="color"
                      value={formData.branding.themeColor}
                      onChange={(e) => updateSection('branding', 'themeColor', e.target.value)}
                      className="settings-color-input"
                    />
                    <input
                      type="text"
                      value={formData.branding.themeColor}
                      onChange={(e) => updateSection('branding', 'themeColor', e.target.value)}
                      placeholder="#b2ff59"
                    />
                  </div>
                </div>
              </div>
            </SettingsCard>

            <div className="settings-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel} disabled={saving}>
                <FiX /> Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="btn-spinner" /> Saving...
                  </>
                ) : (
                  <>
                    <FiSave /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
