module.exports = {
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn()
    })),
    usePathname: jest.fn()
};