import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Tag, Calendar, DollarSign, FileSpreadsheet } from 'lucide-react';
import { quotationsService, customersService, servicesService, settingsService } from '../../services/db';
import { Customer, ServiceItem, OrderItem, QuotationStatus } from '../../types';
import { formatCurrency, generateQuotationCode } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const CreateQuotationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [quotationCode, setQuotationCode] = useState('');
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [discount, setDiscount] = useState<number>(0);
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('draft');

  const [items, setItems] = useState<OrderItem[]>([
    {
      id: `q-item-${Date.now()}`,
      name: 'Thiết kế Website Doanh nghiệp Chuẩn SEO',
      quantity: 1,
      unitPrice: 8500000,
      totalPrice: 8500000,
    },
  ]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [cList, sList, qList, appSettings] = await Promise.all([
          customersService.getAll(),
          servicesService.getAll(),
          quotationsService.getAll(),
          settingsService.get(),
        ]);
        setCustomers(cList);
        setServices(sList);
        setQuotationCode(generateQuotationCode(qList.length));
        setTerms(appSettings.defaultTerms || 'Báo giá có hiệu lực trong vòng 15 ngày.');

        if (!customerId && cList.length > 0) {
          setCustomerId(cList[0].id);
        }
      } catch (err: any) {
        error(err.message || 'Lỗi khởi tạo');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const updateItem = (index: number, field: keyof OrderItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = Number(item.quantity) * Number(item.unitPrice);
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddFromService = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const srvId = e.target.value;
    if (!srvId) return;
    const srv = services.find((s) => s.id === srvId);
    if (srv) {
      setItems([
        ...items,
        {
          id: `q-item-${Date.now()}`,
          serviceId: srv.id,
          name: srv.name,
          quantity: 1,
          unitPrice: srv.defaultPrice,
          totalPrice: srv.defaultPrice,
        },
      ]);
    }
    e.target.value = '';
  };

  const handleAddBlankItem = () => {
    setItems([
      ...items,
      {
        id: `q-item-${Date.now()}`,
        name: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      error('Báo giá cần tối thiểu một hạng mục');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      error('Vui lòng chọn khách hàng');
      return;
    }
    if (!title.trim()) {
      error('Vui lòng nhập tiêu đề báo giá');
      return;
    }

    try {
      const newQuote = await quotationsService.create({
        quotationCode,
        customerId,
        title,
        items,
        subtotal,
        discount: Number(discount || 0),
        total,
        validUntil,
        terms,
        status,
      });

      success('Đã tạo báo giá thành công!');
      navigate(`/admin/quotations/${newQuote.id}`);
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu báo giá');
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/quotations"
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Lập Báo Giá Thiết Kế Website</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dự toán hạng mục chi phí và điều khoản gửi khách hàng</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Thông Tin Khách Hàng & Báo Giá</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã báo giá</label>
              <input
                type="text"
                disabled
                value={quotationCode}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khách hàng <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.company ? `- ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="draft">Bản nháp</option>
                <option value="sent">Đã gửi cho khách</option>
                <option value="accepted">Khách đã chấp nhận</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề báo giá <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Báo giá Xây dựng Website Catalogue Giới thiệu Sản phẩm"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hiệu lực đến ngày</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Các Hạng Mục Dịch Vụ Đề Xuất</h2>
              <p className="text-xs text-slate-500">Thêm gói thiết kế và các tính năng mở rộng</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                onChange={handleAddFromService}
                defaultValue=""
                className="px-3 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="" disabled>
                  + Chèn từ dịch vụ mẫu...
                </option>
                {services
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCurrency(s.defaultPrice)})
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleAddBlankItem}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
              >
                + Thêm dòng
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    required
                    placeholder="Tên hạng mục..."
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="w-36 shrink-0">
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="w-36 shrink-0 text-right">
                  <span className="text-xs font-bold text-slate-800">{formatCurrency(item.totalPrice)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-slate-100 flex flex-col items-end space-y-2 text-xs">
            <div className="flex items-center justify-between w-64 text-slate-600">
              <span>Tạm tính:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between w-64 text-slate-600">
              <span>Chiết khấu / Ưu đãi:</span>
              <input
                type="number"
                min={0}
                step={50000}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-32 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between w-64 pt-2 border-t border-slate-200 text-sm font-bold text-slate-800">
              <span>Tổng chi phí:</span>
              <span className="text-brand-600 text-base">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Điều khoản & Cam kết dịch vụ</label>
          <textarea
            rows={4}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            to="/admin/quotations"
            className="px-5 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition"
          >
            Lưu báo giá
          </button>
        </div>
      </form>
    </div>
  );
};
