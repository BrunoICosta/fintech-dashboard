import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { generateTransactions } from '../data/generate';
import { TransactionsTable } from './TransactionsTable';

const data = generateTransactions().slice(0, 500);

describe('TransactionsTable', () => {
  it('shows the total count and narrows it when filters change', async () => {
    render(<TransactionsTable transactions={data} />);
    expect(screen.getByText('500 of 500 transactions')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'declined' } });
    const declined = data.filter((t) => t.status === 'declined').length;
    expect(screen.getByText(`${declined} of 500 transactions`)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search by transaction ID or customer'), {
      target: { value: 'no-such-customer' },
    });
    await waitFor(() => expect(screen.getByText('No transactions match these filters.')).toBeTruthy());
  });

  it('toggles sort direction from the column header', () => {
    render(<TransactionsTable transactions={data} />);
    const header = screen.getByRole('columnheader', { name: /amount/i });
    expect(header.getAttribute('aria-sort')).toBe('none');

    fireEvent.click(screen.getByRole('button', { name: /amount/i }));
    expect(header.getAttribute('aria-sort')).toBe('descending');

    fireEvent.click(screen.getByRole('button', { name: /amount/i }));
    expect(header.getAttribute('aria-sort')).toBe('ascending');
  });
});
