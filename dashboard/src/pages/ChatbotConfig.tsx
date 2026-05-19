import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, UtensilsCrossed, ChevronDown, ChevronUp, Link as LinkIcon, MapPin, Clock, Edit3, Check, Camera, FileText } from 'lucide-react';
import { chatbotApi } from '../services/api';
import type { RestaurantConfig, MenuCategory, MenuItem } from '../services/api';
import './ChatbotConfig.css';

export function ChatbotConfig() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cargar configuración inicial
  useEffect(() => {
    async function loadData() {
      try {
        const data = await chatbotApi.getConfig();
        setConfig(data);
      } catch (err) {
        console.error('Error al cargar la configuración del chatbot:', err);
        showToast('error', t('chatbot.saveError'));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [t]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Manejar cambios en campos generales
  const handleGeneralChange = (field: keyof RestaurantConfig, value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      [field]: value,
    });
  };

  // Guardar configuración completa en el servidor
  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await chatbotApi.updateConfig(config);
      showToast('success', t('chatbot.saveSuccess'));
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      showToast('error', t('chatbot.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // --- CATEGORÍAS ---
  const handleAddCategory = () => {
    if (!config) return;
    const newCategory: MenuCategory = {
      category: 'Nueva Categoría 🍕',
      items: [],
    };
    const updatedMenu = [...config.menu, newCategory];
    setConfig({ ...config, menu: updatedMenu });
    setActiveCategoryIndex(updatedMenu.length - 1);
  };

  const handleCategoryNameChange = (index: number, newName: string) => {
    if (!config) return;
    const updatedMenu = [...config.menu];
    updatedMenu[index].category = newName;
    setConfig({ ...config, menu: updatedMenu });
  };

  const handleDeleteCategory = (index: number) => {
    if (!config) return;
    if (window.confirm(t('chatbot.confirmDeleteCategory'))) {
      const updatedMenu = config.menu.filter((_, i) => i !== index);
      setConfig({ ...config, menu: updatedMenu });
      setActiveCategoryIndex(updatedMenu.length > 0 ? 0 : null);
    }
  };

  // --- PLATOS / ITEMS ---
  const handleAddDish = (catIndex: number) => {
    if (!config) return;
    const newDish: MenuItem = {
      id: 'item_' + Date.now(),
      name: 'Nuevo Plato',
      price: 0,
      description: 'Ingresa la descripción del plato aquí.',
    };
    const updatedMenu = [...config.menu];
    updatedMenu[catIndex].items.push(newDish);
    setConfig({ ...config, menu: updatedMenu });
  };

  const handleDishChange = (catIndex: number, dishIndex: number, field: keyof MenuItem, value: string | number) => {
    if (!config) return;
    const updatedMenu = [...config.menu];
    const item = updatedMenu[catIndex].items[dishIndex];
    
    // Validar tipo de dato para precio
    if (field === 'price') {
      const parsed = parseInt(value.toString().replace(/\D/g, ''), 10);
      item.price = isNaN(parsed) ? 0 : parsed;
    } else {
      (item as any)[field] = value;
    }
    
    setConfig({ ...config, menu: updatedMenu });
  };

  const handleDeleteDish = (catIndex: number, dishIndex: number) => {
    if (!config) return;
    const updatedMenu = [...config.menu];
    updatedMenu[catIndex].items = updatedMenu[catIndex].items.filter((_, i) => i !== dishIndex);
    setConfig({ ...config, menu: updatedMenu });
  };

  const handleFileChange = async (catIndex: number, dishIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await chatbotApi.uploadImage(formData);
      const updatedMenu = [...config.menu];
      const item = updatedMenu[catIndex].items[dishIndex];
      (item as any).imageUrl = response.imageUrl;
      setConfig({ ...config, menu: updatedMenu });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleImportPdfClick = () => {
    document.getElementById('pdf-upload-input')?.click();
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    showToast('success', 'Importando catálogo desde PDF... (Demo)');
    setTimeout(() => {
      if (!config) return;
      const mockCategory: MenuCategory = {
        category: 'Importado de PDF 📄',
        items: [
          { id: 'pdf_1', name: 'Plato PDF 1', price: 15000, description: 'Descripción extraída del PDF' },
          { id: 'pdf_2', name: 'Plato PDF 2', price: 20000, description: 'Descripción extraída del PDF' },
        ]
      };
      setConfig({ ...config, menu: [...config.menu, mockCategory] });
      showToast('success', 'Menú importado exitosamente desde el PDF');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="chatbot-loading">
        <div className="spinner"></div>
        <p>Cargando información del bot...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="chatbot-error-state">
        <p>No se pudo cargar la configuración del menú.</p>
      </div>
    );
  }

  return (
    <div className="chatbot-config-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`chatbot-toast ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? <Check size={18} /> : <span style={{ fontWeight: 'bold' }}>!</span>}
          </div>
          <div className="toast-text">{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <div className="page-header-container">
        <div className="title-section">
          <div className="icon-wrapper">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1>{t('chatbot.title')}</h1>
            <p className="subtitle">{t('chatbot.subtitle')}</p>
          </div>
        </div>

        <button className="save-btn-primary" onClick={handleSave} disabled={isSaving}>
          <Save size={18} />
          {isSaving ? t('chatbot.saving') : 'Guardar en Caliente'}
        </button>
      </div>

      <div className="config-grid">
        {/* Panel Izquierdo: Configuración General */}
        <div className="config-panel general-settings-panel">
          <h2 className="panel-title">
            <Edit3 size={18} />
            {t('chatbot.generalSettings')}
          </h2>

          <div className="form-group">
            <label>{t('chatbot.restaurantName')}</label>
            <div className="input-with-icon">
              <input
                type="text"
                value={config.name}
                onChange={(e) => handleGeneralChange('name', e.target.value)}
                placeholder="Nombre del restaurante"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Teléfono de Contacto</label>
            <div className="input-with-icon">
              <input
                type="text"
                value={config.phone}
                onChange={(e) => handleGeneralChange('phone', e.target.value)}
                placeholder="Teléfono"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('chatbot.catalogUrl')}</label>
            <div className="input-with-icon">
              <LinkIcon size={16} className="icon-left" />
              <input
                type="text"
                className="has-icon-left"
                value={config.catalogUrl}
                onChange={(e) => handleGeneralChange('catalogUrl', e.target.value)}
                placeholder="https://wa.me/c/..."
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('chatbot.address')}</label>
            <div className="input-with-icon">
              <MapPin size={16} className="icon-left" />
              <input
                type="text"
                className="has-icon-left"
                value={config.address}
                onChange={(e) => handleGeneralChange('address', e.target.value)}
                placeholder="Dirección física"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('chatbot.mapsUrl')}</label>
            <div className="input-with-icon">
              <LinkIcon size={16} className="icon-left" />
              <input
                type="text"
                className="has-icon-left"
                value={config.mapsUrl}
                onChange={(e) => handleGeneralChange('mapsUrl', e.target.value)}
                placeholder="Enlace de Google Maps"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('chatbot.hours')}</label>
            <div className="input-with-icon">
              <Clock size={16} className="icon-left" />
              <input
                type="text"
                className="has-icon-left"
                value={config.hours}
                onChange={(e) => handleGeneralChange('hours', e.target.value)}
                placeholder="Lunes a Domingo: 12 PM - 10 PM"
              />
            </div>
          </div>
        </div>

        {/* Panel Derecho: Categorías y Platos */}
        <div className="config-panel menu-settings-panel">
          <div className="menu-header">
            <h2 className="panel-title">
              <UtensilsCrossed size={18} />
              {t('chatbot.menuManagement')}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="add-category-btn" onClick={handleImportPdfClick} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <FileText size={16} />
                Importar PDF
              </button>
              <input
                type="file"
                id="pdf-upload-input"
                style={{ display: 'none' }}
                onChange={handlePdfChange}
                accept=".pdf"
              />
              <button className="add-category-btn" onClick={handleAddCategory}>
                <Plus size={16} />
                {t('chatbot.addCategory')}
              </button>
            </div>
          </div>

          <div className="categories-list">
            {config.menu.map((cat, catIndex) => {
              const isActive = activeCategoryIndex === catIndex;
              return (
                <div key={catIndex} className={`category-card ${isActive ? 'active' : ''}`}>
                  <div 
                    className="category-card-header"
                    onClick={() => setActiveCategoryIndex(isActive ? null : catIndex)}
                  >
                    <div className="category-title-edit" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={cat.category}
                        onChange={(e) => handleCategoryNameChange(catIndex, e.target.value)}
                        placeholder="Nombre de Categoría"
                        className="category-name-input"
                      />
                    </div>
                    <div className="category-actions">
                      <button 
                        className="delete-category-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(catIndex);
                        }}
                        title={t('chatbot.deleteCategory')}
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="dishes-count">{cat.items.length} platos</span>
                      {isActive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {isActive && (
                    <div className="category-card-body">
                      <div className="dishes-list">
                        {cat.items.map((dish, dishIndex) => (
                          <div key={dish.id} className="dish-row">
                            <div className="dish-field photo-field" style={{ flex: '0 0 auto' }}>
                              <label>Foto</label>
                              <div 
                                className="photo-upload-box" 
                                onClick={() => document.getElementById(`file-${catIndex}-${dishIndex}`)?.click()}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  backgroundColor: '#2a3942',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  border: '1px solid #222e35'
                                }}
                              >
                                {(dish as any).imageUrl ? (
                                  <img src={(dish as any).imageUrl} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Camera size={18} color="#94a3b8" />
                                )}
                              </div>
                              <input
                                type="file"
                                id={`file-${catIndex}-${dishIndex}`}
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileChange(catIndex, dishIndex, e)}
                                accept="image/*"
                              />
                            </div>
                            <div className="dish-field name-field">
                              <label>{t('chatbot.dishName')}</label>
                              <input
                                type="text"
                                value={dish.name}
                                onChange={(e) => handleDishChange(catIndex, dishIndex, 'name', e.target.value)}
                                placeholder="Ej: Hamburguesa Especial"
                              />
                            </div>
                            <div className="dish-field price-field">
                              <label>{t('chatbot.price')} (COP)</label>
                              <input
                                type="text"
                                value={dish.price.toLocaleString('es-CO')}
                                onChange={(e) => handleDishChange(catIndex, dishIndex, 'price', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="dish-field desc-field">
                              <label>{t('chatbot.description')}</label>
                              <input
                                type="text"
                                value={dish.description}
                                onChange={(e) => handleDishChange(catIndex, dishIndex, 'description', e.target.value)}
                                placeholder="Ej: Carne de 150g, tocino, queso..."
                              />
                            </div>
                            <button
                              className="delete-dish-btn"
                              onClick={() => handleDeleteDish(catIndex, dishIndex)}
                              title={t('chatbot.deleteDish')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button className="add-dish-btn" onClick={() => handleAddDish(catIndex)}>
                        <Plus size={16} />
                        {t('chatbot.addDish')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {config.menu.length === 0 && (
              <div className="empty-menu-state">
                <p>No has creado ninguna categoría de menú aún.</p>
                <button className="add-category-btn" onClick={handleAddCategory}>
                  <Plus size={16} />
                  Crear mi primera categoría
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
