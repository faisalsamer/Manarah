"""
Complete Database Seeding Script
Populates all tables with realistic test data for hackathon demo
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import (
    db, User, Bank, Account, RecurringExpense, PaymentTransaction,
    Marsa, MarsaTransaction, UserZakatSettings, ZakatAsset,
    ZakatLiability, AIRecommendation
)
from decimal import Decimal
from datetime import datetime, timedelta, date
import json
import uuid

def read_json(filename):
    """Read JSON file from data directory"""
    filepath = os.path.join('data', filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def seed_full_database():
    """Seed database with comprehensive test data"""
    
    with app.app_context():
        print("🌱 Starting comprehensive database seeding...")
        
        # Clear existing data
        print("🗑️  Dropping all tables...")
        db.drop_all()
        
        print("📋 Creating tables...")
        db.create_all()
        print("✅ Tables created\n")
        
        # ============ STEP 1: CREATE USER ============
        print("👤 Creating user...")
        user = User(
            id='CUST001',
            name='Ahmed Al-Farsi',
            email='ahmed.alfarsi@example.com'
        )
        db.session.add(user)
        db.session.commit()
        print(f"   ✅ User: {user.name}\n")
        
        # ============ STEP 2: CREATE BANKS & ACCOUNTS ============
        print("🏦 Creating banks and accounts...")
        banks_data = read_json('banks_data.json')
        
        accounts_created = []
        for bank_data in banks_data['banks']:
            if bank_data['is_user_connected']:
                bank = Bank(
                    id=bank_data['bank_id'],
                    user_id='CUST001',
                    bank_id=bank_data['bank_id'],
                    bank_name=bank_data['bank_name'],
                    bank_name_ar=bank_data.get('bank_name_ar'),
                    is_connected=True,
                    connected_at=datetime.utcnow()
                )
                db.session.add(bank)
                print(f"   ✅ Bank: {bank.bank_name}")
                
                # Add accounts
                if 'customers' in bank_data and bank_data['customers']:
                    for customer in bank_data['customers']:
                        if customer['customer_id'] == 'CUST001':
                            for account_data in customer['accounts']:
                                account = Account(
                                    id=account_data['account_id'],
                                    bank_id=bank.id,
                                    account_id=account_data['account_id'],
                                    account_number=account_data['account_number'],
                                    account_type=account_data['account_type'],
                                    balance=Decimal(str(account_data['balance'])),
                                    currency=account_data['currency']
                                )
                                db.session.add(account)
                                accounts_created.append(account)
                                print(f"      💰 {account.account_type}: {account.balance} SAR")
        
        db.session.commit()
        print(f"\n   📊 Total: {len(accounts_created)} accounts created\n")
        
        # ============ STEP 3: CREATE RECURRING EXPENSES ============
        print("💳 Creating recurring expenses...")
        
        expenses_data = [
            {
                'id': 'EXP001',
                'title': 'Rent',
                'description': 'Monthly apartment rent',
                'amount': Decimal('1200.00'),
                'unit': 'month',
                'day_of_month': 1
            },
            {
                'id': 'EXP002',
                'title': 'Electricity',
                'description': 'Electricity bill',
                'amount': Decimal('150.00'),
                'unit': 'month',
                'day_of_month': 5
            },
            {
                'id': 'EXP003',
                'title': 'Internet',
                'description': 'Home internet subscription',
                'amount': Decimal('120.00'),
                'unit': 'month',
                'day_of_month': 10
            },
            {
                'id': 'EXP004',
                'title': 'Mobile',
                'description': 'Mobile phone bill',
                'amount': Decimal('80.00'),
                'unit': 'month',
                'day_of_month': 15
            },
            {
                'id': 'EXP005',
                'title': 'Gym Membership',
                'description': 'Fitness First membership',
                'amount': Decimal('200.00'),
                'unit': 'month',
                'day_of_month': 1
            },
            {
                'id': 'EXP006',
                'title': 'Groceries',
                'description': 'Weekly groceries',
                'amount': Decimal('400.00'),
                'unit': 'week',
                'day_of_week': 'fri'
            },
        ]
        
        for exp_data in expenses_data:
            expense = RecurringExpense(
                id=exp_data['id'],
                user_id='CUST001',
                account_id=accounts_created[0].id,  # Use first account (salary)
                title=exp_data['title'],
                description=exp_data['description'],
                amount_type='fixed',
                amount=exp_data['amount'],
                unit=exp_data['unit'],
                interval=1,
                day_of_month=exp_data.get('day_of_month'),
                day_of_week=exp_data.get('day_of_week'),
                time_of_day=datetime.strptime('09:00', '%H:%M').time(),
                payment_mode='auto',
                status='active'
            )
            db.session.add(expense)
            print(f"   ✅ {expense.title}: {expense.amount} SAR/{expense.unit}")
        
        db.session.commit()
        print(f"\n   📊 Total: {len(expenses_data)} recurring expenses created\n")
        
        # ============ STEP 4: CREATE PAYMENT TRANSACTIONS ============
        print("📝 Creating payment transaction history...")
        
        # Create 20 payment transactions (past 3 months)
        transaction_count = 0
        for i in range(20):
            days_ago = 90 - (i * 4)
            scheduled_date = datetime.utcnow() - timedelta(days=days_ago)
            executed_date = scheduled_date + timedelta(hours=2)
            
            # Random expense
            expense_idx = i % len(expenses_data)
            expense_id = expenses_data[expense_idx]['id']
            amount = expenses_data[expense_idx]['amount']
            
            # 90% success, 10% failed
            status = 'succeeded' if i % 10 != 0 else 'failed'
            
            transaction = PaymentTransaction(
                id=f'TXN{str(i+1).zfill(3)}',
                recurring_expense_id=expense_id,
                user_id='CUST001',
                account_id=accounts_created[0].id,
                scheduled_for=scheduled_date,
                executed_at=executed_date if status == 'succeeded' else None,
                amount=amount,
                status=status,
                retry_count=0 if status == 'succeeded' else 3,
                bank_ref=f'REF{uuid.uuid4().hex[:8].upper()}' if status == 'succeeded' else None,
                failure_reason='Insufficient funds' if status == 'failed' else None,
                resolved_manually=False
            )
            db.session.add(transaction)
            transaction_count += 1
        
        db.session.commit()
        print(f"   ✅ {transaction_count} payment transactions created\n")
        
        # ============ STEP 5: CREATE MARASI (SAVINGS GOALS) ============
        print("🎯 Creating savings goals (Marasi)...")
        
        marasi_data = [
            {
                'id': 'MAR001',
                'title': 'Emergency Fund',
                'target': Decimal('24000.00'),
                'current': Decimal('12500.00'),
                'periodic': Decimal('2000.00'),
                'frequency': 'monthly',
                'target_date': date.today() + timedelta(days=180)
            },
            {
                'id': 'MAR002',
                'title': 'Car Down Payment',
                'target': Decimal('30000.00'),
                'current': Decimal('8400.00'),
                'periodic': Decimal('1200.00'),
                'frequency': 'monthly',
                'target_date': date.today() + timedelta(days=365)
            },
            {
                'id': 'MAR003',
                'title': 'Vacation Fund',
                'target': Decimal('10000.00'),
                'current': Decimal('3500.00'),
                'periodic': Decimal('500.00'),
                'frequency': 'biweekly',
                'target_date': date.today() + timedelta(days=180)
            },
        ]
        
        for mar_data in marasi_data:
            marsa = Marsa(
                id=mar_data['id'],
                user_id='CUST001',
                account_id=accounts_created[1].id if len(accounts_created) > 1 else accounts_created[0].id,
                title=mar_data['title'],
                target_amount=mar_data['target'],
                periodic_amount=mar_data['periodic'],
                frequency=mar_data['frequency'],
                target_date=mar_data['target_date'],
                current_balance=mar_data['current'],
                status='active',
                next_deposit_at=datetime.utcnow() + timedelta(days=15)
            )
            db.session.add(marsa)
            progress = (mar_data['current'] / mar_data['target'] * 100)
            print(f"   ✅ {marsa.title}: {progress:.1f}% ({mar_data['current']}/{mar_data['target']} SAR)")
        
        db.session.commit()
        print(f"\n   📊 Total: {len(marasi_data)} savings goals created\n")
        
        # ============ STEP 6: CREATE MARASI TRANSACTIONS ============
        print("💰 Creating marasi transaction history...")
        
        marsa_tx_count = 0
        for mar_data in marasi_data:
            # Create 5 historical deposits for each goal
            for i in range(5):
                days_ago = 30 * (i + 1)
                deposit_date = datetime.utcnow() - timedelta(days=days_ago)
                
                marsa_tx = MarsaTransaction(
                    id=f'MARTX{mar_data["id"][-3:]}{str(i+1).zfill(2)}',
                    marsa_id=mar_data['id'],
                    user_id='CUST001',
                    account_id=accounts_created[0].id,
                    type='auto_debit',
                    amount=mar_data['periodic'],
                    scheduled_for=deposit_date,
                    executed_at=deposit_date + timedelta(hours=1),
                    status='succeeded',
                    bank_ref=f'MREF{uuid.uuid4().hex[:8].upper()}'
                )
                db.session.add(marsa_tx)
                marsa_tx_count += 1
        
        db.session.commit()
        print(f"   ✅ {marsa_tx_count} marasi transactions created\n")
        
        # ============ STEP 7: CREATE ZAKAT SETTINGS ============
        print("☪️  Creating zakah settings...")
        
        zakat_settings = UserZakatSettings(
            id='ZAK001',
            user_id='CUST001',
            nisab_standard='SILVER',
            nisab_standard_confirmed=True,
            previous_net_balance=Decimal('50000.00'),
            last_zakat_payment_date=datetime.utcnow() - timedelta(days=300),
            is_setup_complete=True,
            auto_pay_enabled=False
        )
        db.session.add(zakat_settings)
        db.session.commit()
        print(f"   ✅ Zakah settings created (Standard: {zakat_settings.nisab_standard})\n")
        
        # ============ STEP 8: CREATE ZAKAT ASSETS ============
        print("💎 Creating zakah assets...")
        
        assets_data = [
            {
                'id': 'ASSET001',
                'type': 'CASH',
                'label': 'Cash Savings',
                'amount': Decimal('15000.00')
            },
            {
                'id': 'ASSET002',
                'type': 'GOLD_SAVINGS',
                'label': 'Gold Jewelry',
                'amount': Decimal('8000.00'),
                'weight': Decimal('150.5'),
                'karat': 21
            },
            {
                'id': 'ASSET003',
                'type': 'STOCKS',
                'label': 'Saudi Stock Market Portfolio',
                'amount': Decimal('25000.00')
            },
        ]
        
        for asset_data in assets_data:
            asset = ZakatAsset(
                id=asset_data['id'],
                user_id='CUST001',
                asset_type=asset_data['type'],
                custom_label=asset_data['label'],
                amount=asset_data['amount'],
                weight_grams=asset_data.get('weight'),
                karat=asset_data.get('karat'),
                owned_since=datetime.utcnow() - timedelta(days=400),
                status='ACTIVE'
            )
            db.session.add(asset)
            print(f"   ✅ {asset.custom_label}: {asset.amount} SAR")
        
        db.session.commit()
        print(f"\n   📊 Total: {len(assets_data)} zakah assets created\n")
        
        # ============ STEP 9: CREATE ZAKAT LIABILITIES ============
        print("📉 Creating zakah liabilities...")
        
        liabilities_data = [
            {
                'id': 'LIAB001',
                'label': 'Personal Loan',
                'amount': Decimal('5000.00'),
                'due_date': datetime.utcnow() + timedelta(days=180),
                'settled': False
            },
        ]
        
        for liab_data in liabilities_data:
            liability = ZakatLiability(
                id=liab_data['id'],
                user_id='CUST001',
                label=liab_data['label'],
                amount=liab_data['amount'],
                due_date=liab_data['due_date'],
                is_settled=liab_data['settled']
            )
            db.session.add(liability)
            print(f"   ✅ {liability.label}: {liability.amount} SAR")
        
        db.session.commit()
        print(f"\n   📊 Total: {len(liabilities_data)} liabilities created\n")
        
        # ============ FINAL SUMMARY ============
        print("\n" + "="*60)
        print("✅ DATABASE SEEDING COMPLETED!")
        print("="*60)
        print(f"   👤 Users: 1")
        print(f"   🏦 Banks: {Bank.query.count()}")
        print(f"   💳 Accounts: {Account.query.count()}")
        print(f"   💰 Total Balance: {sum(acc.balance for acc in Account.query.all())} SAR")
        print(f"   📝 Recurring Expenses: {RecurringExpense.query.count()}")
        print(f"   📊 Payment Transactions: {PaymentTransaction.query.count()}")
        print(f"   🎯 Savings Goals (Marasi): {Marsa.query.count()}")
        print(f"   💸 Marasi Transactions: {MarsaTransaction.query.count()}")
        print(f"   ☪️  Zakah Assets: {ZakatAsset.query.count()}")
        print(f"   📉 Liabilities: {ZakatLiability.query.count()}")
        print("="*60)
        print("\n🎉 Ready for testing! Run Flask app now.\n")

if __name__ == '__main__':
    seed_full_database()