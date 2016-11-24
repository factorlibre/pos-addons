# -*- coding: utf-8 -*-
# Copyright 2016 FactorLibre - Ismael Calvo <ismael.calvo@factorlibre.com>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp import api, fields, models


class PosOrder(models.Model):
    _inherit = 'pos.order'

    sale_order = fields.Many2one(
        'sale.order', 'Related Sale Order', readonly=True)

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['sale_order'] = ui_order['sale_order_id']
        return res
