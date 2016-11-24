Sale orders in POS
==================

- Fill pos cart by sale order ID.
- Only loads sale orders with:
    - State cancel
    - No payments
    - No pickings
- Cancels the original sale order when validate the new POS order
- Relates, through a field, the new POS order with the original sale order

Tested on Odoo 8.0 d023c079ed86468436f25da613bf486a4a17d625
