import json
import os

def generate_saudi_banks_data():
    """Generate comprehensive Saudi banks data"""
    
    banks_data = {
        "banks": [
            # ========== BANK 1: Al Rajhi Bank (USER'S BANK - 2 ACCOUNTS) ==========
            {
                "bank_id": "rajhi_bank",
                "bank_name": "Al Rajhi Bank",
                "bank_name_ar": "مصرف الراجحي",
                "bank_code": "RJHI",
                "swift_code": "RJHISARI",
                "country": "SA",
                "type": "Islamic",
                "founded": "1957",
                "website": "https://www.alrajhibank.com.sa",
                "is_user_connected": True,
                "customers": [
                    {
                        "customer_id": "CUST001",
                        "full_name": "Ahmed Al-Farsi",
                        "username": "ahmed.alfarsi",
                        "email": "ahmed@example.com",
                        "phone": "+966501234567",
                        "national_id": "1234567890",
                        "status": "active",
                        "customer_since": "2020-01-15",
                        "accounts": [
                            {
                                "account_id": "ACC001",
                                "account_number": "SA0380000000608010167519",
                                "iban": "SA0380000000608010167519",
                                "account_type": "salary",
                                "account_name": "Salary Account",
                                "currency": "SAR",
                                "balance": 12450.30,
                                "available_balance": 12450.30,
                                "status": "active",
                                "opened_date": "2020-01-15",
                                "is_primary": True,
                                "monthly_limit": 50000,
                                "daily_limit": 10000
                            },
                            {
                                "account_id": "ACC002",
                                "account_number": "SA0380000000608010167520",
                                "iban": "SA0380000000608010167520",
                                "account_type": "savings",
                                "account_name": "Savings Account",
                                "currency": "SAR",
                                "balance": 38200.00,
                                "available_balance": 38200.00,
                                "status": "active",
                                "opened_date": "2020-01-15",
                                "is_primary": False,
                                "interest_rate": 0,
                                "monthly_limit": 20000,
                                "daily_limit": 5000
                            }
                        ],
                        "total_balance": 50650.30
                    }
                ]
            },
            
            # ========== BANK 2: Saudi National Bank (USER'S BANK - 1 ACCOUNT) ==========
            {
                "bank_id": "snb_bank",
                "bank_name": "Saudi National Bank",
                "bank_name_ar": "البنك الأهلي السعودي",
                "bank_code": "SNB",
                "swift_code": "NCBKSAJE",
                "country": "SA",
                "type": "Commercial",
                "founded": "1953",
                "website": "https://www.alahli.com",
                "is_user_connected": True,
                "customers": [
                    {
                        "customer_id": "CUST001",
                        "full_name": "Ahmed Al-Farsi",
                        "username": "ahmed.alfarsi",
                        "email": "ahmed@example.com",
                        "phone": "+966501234567",
                        "national_id": "1234567890",
                        "status": "active",
                        "customer_since": "2019-03-20",
                        "accounts": [
                            {
                                "account_id": "ACC003",
                                "account_number": "SA0310000000123456789012",
                                "iban": "SA0310000000123456789012",
                                "account_type": "current",
                                "account_name": "Current Account",
                                "currency": "SAR",
                                "balance": 8200.00,
                                "available_balance": 8200.00,
                                "status": "active",
                                "opened_date": "2019-03-20",
                                "is_primary": False,
                                "monthly_limit": 30000,
                                "daily_limit": 8000
                            }
                        ],
                        "total_balance": 8200.00
                    }
                ]
            },
            
            # ========== OTHER SAUDI BANKS (NOT CONNECTED) ==========
            
            # BANK 3: Riyad Bank
            {
                "bank_id": "riyad_bank",
                "bank_name": "Riyad Bank",
                "bank_name_ar": "بنك الرياض",
                "bank_code": "RIBL",
                "swift_code": "RIBLSARI",
                "country": "SA",
                "type": "Commercial",
                "founded": "1957",
                "website": "https://www.riyadbank.com",
                "is_user_connected": False,
                "customers": []
            },
            
            # BANK 4: Saudi Fransi Bank
            {
                "bank_id": "banque_saudi_fransi",
                "bank_name": "Banque Saudi Fransi",
                "bank_name_ar": "البنك السعودي الفرنسي",
                "bank_code": "BSFR",
                "swift_code": "BSFRSARI",
                "country": "SA",
                "type": "Commercial",
                "founded": "1977",
                "website": "https://www.alfransi.com.sa",
                "is_user_connected": False,
                "customers": []
            },
            
            # BANK 5: Saudi Investment Bank
            {
                "bank_id": "saib_bank",
                "bank_name": "Saudi Investment Bank",
                "bank_name_ar": "البنك السعودي للاستثمار",
                "bank_code": "SAIB",
                "swift_code": "SIBCSARI",
                "country": "SA",
                "type": "Commercial",
                "founded": "1976",
                "website": "https://www.saib.com.sa",
                "is_user_connected": False,
                "customers": []
            },
            
            # BANK 6: Alinma Bank
            {
                "bank_id": "alinma_bank",
                "bank_name": "Alinma Bank",
                "bank_name_ar": "مصرف الإنماء",
                "bank_code": "ALIN",
                "swift_code": "INMASARI",
                "country": "SA",
                "type": "Islamic",
                "founded": "2006",
                "website": "https://www.alinma.com",
                "is_user_connected": False,
                "customers": []
            },
            
            # BANK 7: Bank AlJazira
            {
                "bank_id": "aljazira_bank",
                "bank_name": "Bank AlJazira",
                "bank_name_ar": "بنك الجزيرة",
                "bank_code": "BAJA",
                "swift_code": "BJAZSAR",
                "country": "SA",
                "type": "Islamic",
                "founded": "1975",
                "website": "https://www.baj.com.sa",
                "is_user_connected": False,
                "customers": []
            },
            
            # BANK 8: Saudi British Bank (SABB)
            {
                "bank_id": "sabb_bank",
                "bank_name": "Saudi British Bank",
                "bank_name_ar": "البنك السعودي البريطاني",
                "bank_code": "SABB",
                "swift_code": "SABBSARI",
                "country": "SA",
                "type": "Commercial",
                "founded": "1978",
                "website": "https://www.sabb.com",
                "is_user_connected": False,
                "customers": []
            },
            
            # BANK 9: Arab National Bank
            {
                "bank_id": "anb_bank",
                "bank_name": "Arab National Bank",
                "bank_name_ar": "البنك العربي الوطني",
                "bank_code": "ARNB",
                "swift_code": "ARNBSARI",
                "country": "SA",
                "type": "Commercial",
                "founded": "1979",
                "website": "https://www.anb.com.sa",
                "is_user_connected": False,
                "customers": []
            },
            
            # BANK 10: Bank AlBilad
            {
                "bank_id": "albilad_bank",
                "bank_name": "Bank AlBilad",
                "bank_name_ar": "بنك البلاد",
                "bank_code": "ALBI",
                "swift_code": "ALBISARI",
                "country": "SA",
                "type": "Islamic",
                "founded": "2004",
                "website": "https://www.bankalbilad.com",
                "is_user_connected": False,
                "customers": []
            }
        ],
        
        "metadata": {
            "total_banks": 10,
            "connected_banks": 2,
            "total_accounts": 3,
            "last_updated": "2026-04-28",
            "country": "Saudi Arabia",
            "currency": "SAR"
        }
    }
    
    return banks_data

def main():
    """Generate and save banks data"""
    
    print("🏦 Generating Saudi Banks Data...\n")
    
    # Create data directory
    os.makedirs('data', exist_ok=True)
    
    # Generate banks data
    banks_data = generate_saudi_banks_data()
    
    # Save to file
    output_file = 'data/banks_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(banks_data, f, indent=2, ensure_ascii=False)
    
    # Summary
    print(f"✅ Generated banks data with {banks_data['metadata']['total_banks']} banks")
    print(f"\n📊 Summary:")
    print(f"   Total Banks: {banks_data['metadata']['total_banks']}")
    print(f"   Connected Banks: {banks_data['metadata']['connected_banks']}")
    print(f"   Total Accounts: {banks_data['metadata']['total_accounts']}")
    
    print(f"\n🔗 User's Connected Banks:")
    for bank in banks_data['banks']:
        if bank['is_user_connected']:
            num_accounts = len(bank['customers'][0]['accounts']) if bank['customers'] else 0
            print(f"   • {bank['bank_name']} ({bank['bank_name_ar']}) - {num_accounts} account(s)")
    
    print(f"\n🏛️  Other Available Banks:")
    for bank in banks_data['banks']:
        if not bank['is_user_connected']:
            bank_type = "🕌 Islamic" if bank['type'] == 'Islamic' else "🏢 Commercial"
            print(f"   • {bank['bank_name']} ({bank['bank_name_ar']}) - {bank_type}")
    
    print(f"\n📁 Saved to: {output_file}")

if __name__ == '__main__':
    main()