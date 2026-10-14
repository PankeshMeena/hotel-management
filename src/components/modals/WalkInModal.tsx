import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHotel } from '../../context/HotelContext';
import { useToast } from '../ui/Toast';
import { Room, IdDocType, VerificationStatus, PaymentMethod, Reservation } from '../../types';
import { formatCurrency, calculateNights } from '../../lib/utils';
import { UserCheck, Shield, Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { RegistrationSlipModal } from './RegistrationSlipModal';
import { IdPhotoUploader } from '../ui/IdPhotoUploader';

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRoom?: Room | null;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  isOpen,
  onClose,
  preselectedRoom,
}) => {
  const { rooms, roomTypes, hotelSettings, walkInCheckIn, guests } = useHotel();
  const { success, error, warning } = useToast();

  // Wizard steps: 1 = Guest Info & ID, 2 = Room & Stay Dates, 3 = Payment & Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Mahakal Marg');
  const [city, setCity] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [country] = useState('India');
  const [idDocumentType, setIdDocumentType] = useState<IdDocType>('Aadhaar');
  const [idDocumentNumber, setIdDocumentNumber] = useState('•••• •••• 7182');
  const [idVerificationStatus, setIdVerificationStatus] = useState<VerificationStatus>('Verified');
  const [idDocumentPhoto, setIdDocumentPhoto] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  // Stay State
  const todayStr = '2026-10-14';
  const tomorrowStr = '2026-10-15';
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(preselectedRoom ? preselectedRoom.roomNumber : '');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [advancePaid, setAdvancePaid] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [specialRequests, setSpecialRequests] = useState('Ground floor quiet room if possible');

  // Completed reservation for registration slip
  const [completedRes, setCompletedRes] = useState<Reservation | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Available rooms for selected dates
  const availableRooms = rooms.filter(
    r => (r.status === 'Available' || r.status === 'Reserved' || r.roomNumber === preselectedRoom?.roomNumber)
  );

  const selectedRoom = rooms.find(r => r.roomNumber === selectedRoomNumber);
  const selectedRoomType = roomTypes.find(rt => rt.id === selectedRoom?.roomTypeId) || roomTypes[0];

  const nights = calculateNights(checkInDate, checkOutDate);
  const nightlyRate = selectedRoomType ? selectedRoomType.basePrice : 999;
  const subtotal = nights * nightlyRate;
  const taxAmount = Math.round(subtotal * (hotelSettings.taxRatePercent / 100));
  const grandTotal = subtotal + taxAmount;
  const balanceDue = Math.max(0, grandTotal - advancePaid);

  // Auto-fill if returning guest phone matches
  const handlePhoneChange = (val: string) => {
    setMobile(val);
    const existing = guests.find(g => g.mobile.replace(/\s+/g, '') === val.replace(/\s+/g, ''));
    if (existing) {
      setFullName(existing.fullName);
      setEmail(existing.email || '');
      setCity(existing.city);
      setState(existing.state);
      setIdDocumentType(existing.idDocumentType);
      setIdDocumentNumber(existing.idDocumentNumber);
      setIdVerificationStatus(existing.idVerificationStatus);
      if (existing.idDocumentPhoto) {
        setIdDocumentPhoto(existing.idDocumentPhoto);
      }
      warning(`Found existing profile for ${existing.fullName}! Details auto-populated.`, 'Returning Guest');
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName.trim() || !mobile.trim()) {
        error('Please provide guest full legal name and mobile number.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedRoomNumber) {
        error('Please select an available room for check-in.');
        return;
      }
      if (new Date(checkOutDate) <= new Date(checkInDate)) {
        error('Departure date must be after check-in date.');
        return;
      }
      setStep(3);
    }
  };

  const handleConfirmCheckIn = () => {
    const res = walkInCheckIn({
      guest: {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        address,
        city,
        state,
        country,
        idDocumentType,
        idDocumentNumber,
        idVerificationStatus,
        idDocumentPhoto: idDocumentPhoto || undefined,
        emergencyContact,
        notes,
      },
      roomNumber: selectedRoomNumber,
      roomTypeId: selectedRoomType.id,
      adults,
      children,
      checkInDate,
      checkOutDate,
      ratePerNight: nightlyRate,
      discount: 0,
      advancePaid,
      paymentMethod,
      bookingSource: 'Direct Walk-in',
      specialRequests,
    });

    if (res.success && res.reservation) {
      success(res.message, 'Check-in Confirmed');
      setCompletedRes(res.reservation);
      setSlipModalOpen(true);
      onClose();
    } else {
      error(res.message, 'Check-in Error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Walk-in Guest Check-in Wizard" maxWidth="3xl">
        {/* Step Tabs */}
        <div className="flex border-b border-slate-200 mb-5">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition ${
              step === 1
                ? 'border-teal-600 text-teal-700 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">1. Guest Identity & Verification</span>
            <span className="sm:hidden">1. Identity</span>
          </button>
          <button
            onClick={() => setStep(2)}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition ${
              step === 2
                ? 'border-teal-600 text-teal-700 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">2. Room Allocation & Dates</span>
            <span className="sm:hidden">2. Rooms</span>
          </button>
          <button
            onClick={() => setStep(3)}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition ${
              step === 3
                ? 'border-teal-600 text-teal-700 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">3. Tariff, Advance & Confirm</span>
            <span className="sm:hidden">3. Tariff</span>
          </button>
        </div>

        {/* Step 1: Guest Information */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Demo Verification Mode:</strong> Standard Indian photo ID required. Aadhaar numbers are masked for privacy.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98260 55112"
                  value={mobile}
                  onChange={e => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City & State</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City (e.g. Indore)"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Document Type</label>
                <select
                  value={idDocumentType}
                  onChange={e => setIdDocumentType(e.target.value as IdDocType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="Aadhaar">Aadhaar Card (Masked)</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Masked Document Number</label>
                <input
                  type="text"
                  placeholder="•••• •••• 7182"
                  value={idDocumentNumber}
                  onChange={e => setIdDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Document Photo Upload & Live Local Preview */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Government Identity Photo (Aadhaar / ID)
              </label>
              <IdPhotoUploader
                value={idDocumentPhoto}
                onChange={setIdDocumentPhoto}
                documentType={idDocumentType === 'Aadhaar' ? 'Aadhaar Card' : idDocumentType}
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Continue to Room Selection →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Room & Dates */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Arrival Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departure Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={e => setCheckOutDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adults Count</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={adults}
                  onChange={e => setAdults(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Children Count</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={children}
                  onChange={e => setChildren(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Available Room <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                {availableRooms.map(rm => {
                  const type = roomTypes.find(rt => rt.id === rm.roomTypeId);
                  const isSelected = selectedRoomNumber === rm.roomNumber;
                  return (
                    <button
                      key={rm.roomNumber}
                      type="button"
                      onClick={() => setSelectedRoomNumber(rm.roomNumber)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-slate-900">Room {rm.roomNumber}</span>
                        <span className="text-[10px] text-slate-500">Fl {rm.floor}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 truncate">{type?.name}</p>
                      <p className="text-[11px] font-bold text-teal-700 mt-1">
                        {formatCurrency(type?.basePrice || 0, hotelSettings.currencySymbol)}
                        <span className="text-[10px] font-normal text-slate-400">/nt</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Special Preferences / Requests</label>
              <input
                type="text"
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder="e.g. Extra blanket, early morning tea"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Continue to Billing & Advance →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tariff & Confirmation */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            {/* Financial Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
                Check-in Financial Estimate
              </h4>
              <div className="flex justify-between text-slate-600">
                <span>Room {selectedRoomNumber} ({selectedRoomType.name}) x {nights} Night(s):</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal, hotelSettings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax ({hotelSettings.taxRatePercent}%):</span>
                <span>{formatCurrency(taxAmount, hotelSettings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1.5">
                <span>Total Expected Bill:</span>
                <span className="text-teal-700">{formatCurrency(grandTotal, hotelSettings.currencySymbol)}</span>
              </div>
            </div>

            {/* Advance Deposit Section */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advance Payment Amount ({hotelSettings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={advancePaid}
                  onChange={e => setAdvancePaid(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash at Desk</option>
                  <option value="Card">Debit / Credit Card (POS)</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex justify-between items-center">
              <div>
                <span className="font-bold block">Remaining Balance:</span>
                <span className="text-[11px] text-amber-700">Payable at checkout</span>
              </div>
              <span className="text-base font-bold text-amber-800">
                {formatCurrency(balanceDue, hotelSettings.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckIn}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md transition"
              >
                Confirm Walk-in & Check-in Guest
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Slip Modal Triggered after check-in */}
      <RegistrationSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        reservation={completedRes}
      />
    </>
  );
};
