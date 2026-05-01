"""
Translates bank-side customer_ids (e.g. 'CUST001' from the simulated banks_data.json)
into the real Supabase users.id (UUID) used by all DB queries.

Bank JSON files key on customer_id; the DB keys on UUID. The frontend currently
sends the customer_id, so every Flask route resolves it through here before
touching the DB.
"""

CUSTOMER_TO_USER_UUID = {
    'CUST001': 'c99dccbc-8cc9-4256-91a0-85298d1a3ccf',
}


def resolve_user_id(incoming):
    if incoming is None:
        return None
    return CUSTOMER_TO_USER_UUID.get(incoming, incoming)
