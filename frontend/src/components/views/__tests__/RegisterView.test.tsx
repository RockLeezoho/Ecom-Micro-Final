import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterView from '../RegisterView'

vi.mock('../../../services/registerService', () => ({
  registerCustomer: vi.fn(),
}))

import { registerCustomer } from '../../../services/registerService'

describe('RegisterView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('submits form and calls onRegister on success', async () => {
    const fakeSession = { customer: { id: '1', username: 'alice' }, access_token: 'a', refresh_token: 'r' }
    ;(registerCustomer as any).mockResolvedValueOnce(fakeSession)

    const onRegister = vi.fn()
    const onNavigate = vi.fn()

    render(<RegisterView onRegister={onRegister} onNavigate={onNavigate} />)

    await userEvent.type(screen.getByPlaceholderText('Tên đăng nhập'), 'alice')
    await userEvent.type(screen.getByPlaceholderText('ten@vidu.com'), 'alice@example.com')
    const pwInputs = screen.getAllByPlaceholderText('••••••••')
    await userEvent.type(pwInputs[0], 'password123')
    // confirm password: second password input has same placeholder
    await userEvent.type(pwInputs[1], 'password123')
    await userEvent.type(screen.getByPlaceholderText('Số điện thoại'), '0123456789')

    await userEvent.click(screen.getByRole('button', { name: /Tạo tài khoản/i }))

    await waitFor(() => {
      expect(registerCustomer).toHaveBeenCalled()
      expect(onRegister).toHaveBeenCalledWith(fakeSession)
    })
  })

  test('renders field errors when API returns validation errors', async () => {
    const apiErr: any = { body: { email: ['Email không hợp lệ'] }, message: 'Invalid' }
    ;(registerCustomer as any).mockRejectedValueOnce(apiErr)

    const onRegister = vi.fn()
    const onNavigate = vi.fn()

    render(<RegisterView onRegister={onRegister} onNavigate={onNavigate} />)

    await userEvent.type(screen.getByPlaceholderText('Tên đăng nhập'), 'bob')
    // use a syntactically valid email so browser constraint validation doesn't block submit
    await userEvent.type(screen.getByPlaceholderText('ten@vidu.com'), 'bob@example.com')
    const pwInputs = screen.getAllByPlaceholderText('••••••••')
    await userEvent.type(pwInputs[0], 'password123')
    await userEvent.type(pwInputs[1], 'password123')
    await userEvent.type(screen.getByPlaceholderText('Số điện thoại'), '0123456789')

    await userEvent.click(screen.getByRole('button', { name: /Tạo tài khoản/i }))

    await waitFor(() => {
      expect(registerCustomer).toHaveBeenCalled()
      expect(screen.getByText(/Email không hợp lệ/)).toBeInTheDocument()
    })
  })
})
