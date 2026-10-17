# ASSUMPTIONS & Known Limitations

## Simplifications for Demonstration

This is a **demo project** for educational purposes. In a real-world production system, several features would need enhancement.

## Known Limitations

### 1. Settlement Simulation
- **Assumption:** Bank settlement is simulated - no real bank API integration
- **Impact:** Settlement amounts are manually confirmed, not verified with actual bank systems
- **Production Need:** Integration with banking APIs, payment gateways

### 2. No Real-time Notifications
- **Assumption:** No push notifications or SMS alerts
- **Impact:** Users must manually check for pending approvals
- **Production Need:** WebSockets, Firebase Cloud Messaging, or SMS gateway

### 3. No File Export
- **Assumption:** No CSV/PDF export functionality
- **Impact:** Data cannot be exported for external reporting
- **Production Need:** Report generation module with Excel, PDF exports

### 4. Temporary URL
- **Assumption:** Using ngrok free tier for demonstration
- **Impact:** URL changes on restart, not suitable for production
- **Production Need:** Custom domain with SSL certificate

### 5. No Audit Log History
- **Assumption:** Basic transaction tracking without full audit history
- **Impact:** Cannot see complete change history for audit compliance
- **Production Need:** Comprehensive audit event logging

### 6. Simple Authentication
- **Assumption:** Basic JWT authentication without 2FA
- **Impact:** No two-factor authentication for enhanced security
- **Production Need:** OTP, biometric, or hardware token integration

### 7. No Offline Mode
- **Assumption:** Requires constant internet connectivity
- **Impact:** Field agents cannot work offline
- **Production Need:** PWA with offline data sync, local storage

### 8. Single Currency
- **Assumption:** All amounts in single currency (INR assumed)
- **Impact:** No multi-currency support
- **Production Need:** Currency conversion, localization

### 9. Basic Branch Isolation
- **Assumption:** Branch managers can see only their branch data
- **Impact:** Simple data isolation, no complex organizational hierarchies
- **Production Need:** Multi-tenant architecture, configurable permissions

### 10. No Data Archival
- **Assumption:** All historical data kept in active database
- **Impact:** Database grows indefinitely
- **Production Need:** Data archival strategy, cold storage

## Security Considerations for Production

1. **Environment Variables:** Never commit .env files with credentials
2. **HTTPS:** Required for production (provided by ngrok in demo)
3. **Database Backups:** Not implemented in demo
4. **Rate Limiting:** Basic implementation, production needs more
5. **Input Validation:** Comprehensive, but production needs penetration testing

## Performance Considerations

1. **Database Indexing:** Basic indexes implemented
2. **Caching:** Not implemented (Redis recommended for production)
3. **Connection Pooling:** Basic Django DB pooling
4. **CDN:** Not used for static assets

## Feature Roadmap

### Phase 2 (Production Ready)
- [ ] Real bank API integration
- [ ] Push notifications
- [ ] Report exports (PDF, Excel)
- [ ] Custom domain with SSL
- [ ] Audit log history
- [ ] Two-factor authentication
- [ ] Offline mode (PWA)
- [ ] Multi-currency support

### Phase 3 (Enterprise)
- [ ] Multi-tenant architecture
- [ ] Advanced reporting & analytics
- [ ] Mobile app (React Native)
- [ ] API rate limiting & throttling
- [ ] Data archival strategy
- [ ] Compliance reporting (GSTR, etc.)

---

**Note:** These assumptions are documented to provide context for evaluators. The current implementation focuses on demonstrating core business logic, role-based access control, and financial integrity controls within the assignment scope.
