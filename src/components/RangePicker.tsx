import { RANGE_OPTIONS, type RangeDays } from '../data/types';

interface RangePickerProps {
  value: RangeDays;
  onChange: (value: RangeDays) => void;
}

export function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <div className="segmented" role="group" aria-label="Date range">
      {RANGE_OPTIONS.map((days) => (
        <button
          key={days}
          type="button"
          className="segmented__option"
          aria-pressed={value === days}
          onClick={() => onChange(days)}
        >
          {days}D
        </button>
      ))}
    </div>
  );
}
