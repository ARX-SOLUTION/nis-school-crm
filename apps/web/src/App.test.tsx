import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should_render_app_title', () => {
    render(<App />);
    expect(screen.getByText('NIS School CRM')).toBeInTheDocument();
  });
});
