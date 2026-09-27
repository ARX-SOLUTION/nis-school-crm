import '@testing-library/jest-dom/vitest';

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function mockShowModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function mockClose() {
    this.open = false;
  };
}
