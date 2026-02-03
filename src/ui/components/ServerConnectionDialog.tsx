import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import type { ServerConnection } from '../types/electron';

interface ServerConnectionDialogProps {
  visible: boolean;
  onHide: () => void;
  onSave: () => void;
  connection: ServerConnection | null;
}

interface FormData {
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
}

interface FormErrors {
  name?: string;
  ipAddress?: string;
  port?: string;
  username?: string;
  password?: string;
}

const ServerConnectionDialog: React.FC<ServerConnectionDialogProps> = ({
  visible,
  onHide,
  onSave,
  connection,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ipAddress: '',
    port: '9000',
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = !!connection;

  // Reset form when dialog opens
  useEffect(() => {
    if (visible) {
      if (connection) {
        setFormData({
          name: connection.name,
          ipAddress: connection.ipAddress,
          port: connection.port,
          username: connection.username,
          password: connection.password,
        });
      } else {
        setFormData({
          name: '',
          ipAddress: '',
          port: '9000',
          username: '',
          password: '',
        });
      }
      setErrors({});
      setSubmitted(false);
    }
  }, [visible, connection]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Connection name is required';
    }

    // IP Address validation
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const hostnameRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!formData.ipAddress) {
      newErrors.ipAddress = 'IP address or hostname is required';
    } else if (
      !ipRegex.test(formData.ipAddress) &&
      !hostnameRegex.test(formData.ipAddress)
    ) {
      newErrors.ipAddress = 'Enter a valid IP address or hostname';
    }

    // Port validation
    const portNum = parseInt(formData.port, 10);
    if (!formData.port) {
      newErrors.port = 'Port is required';
    } else if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      newErrors.port = 'Enter a valid port (1-65535)';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (validateForm()) {
      setSaving(true);
      try {
        await window.electron.saveConnection({
          id: connection?.id,
          name: formData.name,
          ipAddress: formData.ipAddress,
          port: formData.port,
          username: formData.username,
          password: formData.password,
        });
        onSave();
      } catch (error) {
        console.error('Failed to save connection:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const isFieldInvalid = (field: keyof FormData) => {
    return submitted && errors[field];
  };

  const dialogFooter = (
    <div className="dialog-footer">
      <Button
        label="Cancel"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        disabled={saving}
      />
      <Button
        label={isEditing ? 'Save Changes' : 'Add Server'}
        icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
        onClick={handleSubmit}
        disabled={saving}
      />
    </div>
  );

  return (
    <Dialog
      header={isEditing ? 'Edit Server Connection' : 'Add Server Connection'}
      visible={visible}
      onHide={onHide}
      footer={dialogFooter}
      className="server-connection-dialog"
      modal
      draggable={false}
      resizable={false}
    >
      <div className="p-fluid">
        {/* Connection Name Field */}
        <div className="field">
          <label htmlFor="name">Connection Name</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-tag"></i>
            </span>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., My Racing Server"
              className={classNames({ 'p-invalid': isFieldInvalid('name') })}
            />
          </div>
          {isFieldInvalid('name') && (
            <small className="p-error">{errors.name}</small>
          )}
        </div>

        {/* IP Address Field */}
        <div className="field">
          <label htmlFor="ipAddress">IP Address / Hostname</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-server"></i>
            </span>
            <InputText
              id="ipAddress"
              value={formData.ipAddress}
              onChange={(e) => handleChange('ipAddress', e.target.value)}
              placeholder="e.g., 192.168.1.100 or server.zap-hosting.com"
              className={classNames({ 'p-invalid': isFieldInvalid('ipAddress') })}
            />
          </div>
          {isFieldInvalid('ipAddress') && (
            <small className="p-error">{errors.ipAddress}</small>
          )}
        </div>

        {/* Port Field */}
        <div className="field">
          <label htmlFor="port">Port</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-hashtag"></i>
            </span>
            <InputText
              id="port"
              value={formData.port}
              onChange={(e) => handleChange('port', e.target.value)}
              placeholder="e.g., 9000"
              keyfilter="int"
              className={classNames({ 'p-invalid': isFieldInvalid('port') })}
            />
          </div>
          {isFieldInvalid('port') && (
            <small className="p-error">{errors.port}</small>
          )}
        </div>

        {/* Username Field */}
        <div className="field">
          <label htmlFor="username">Username</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-user"></i>
            </span>
            <InputText
              id="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Admin username"
              className={classNames({ 'p-invalid': isFieldInvalid('username') })}
            />
          </div>
          {isFieldInvalid('username') && (
            <small className="p-error">{errors.username}</small>
          )}
        </div>

        {/* Password Field */}
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-lock"></i>
            </span>
            <InputText
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Admin password"
              className={classNames({ 'p-invalid': isFieldInvalid('password') })}
            />
          </div>
          {isFieldInvalid('password') && (
            <small className="p-error">{errors.password}</small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ServerConnectionDialog;