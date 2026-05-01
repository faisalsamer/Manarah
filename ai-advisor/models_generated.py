from typing import Optional
import datetime
import decimal
import enum
import uuid

from sqlalchemy import BigInteger, Boolean, CheckConstraint, Column, Date, DateTime, Double, Enum, ForeignKeyConstraint, Index, Integer, JSON, Numeric, PrimaryKeyConstraint, String, Table, Text, Time, UniqueConstraint, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB, OID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class AmountType(str, enum.Enum):
    FIXED = 'fixed'
    VARIABLE = 'variable'


class AssetHistoryAction(str, enum.Enum):
    CREATED = 'CREATED'
    UPDATED = 'UPDATED'
    DELETED = 'DELETED'
    ZAKAT_PAID = 'ZAKAT_PAID'


class AssetStatus(str, enum.Enum):
    ACTIVE = 'ACTIVE'
    ZAKAT_PAID = 'ZAKAT_PAID'
    DELETED = 'DELETED'
    EDITED = 'EDITED'


class AssetType(str, enum.Enum):
    GOLD_SAVINGS = 'GOLD_SAVINGS'
    SILVER_SAVINGS = 'SILVER_SAVINGS'
    STOCKS = 'STOCKS'
    CONFIRMED_DEBTS = 'CONFIRMED_DEBTS'
    TRADE_GOODS = 'TRADE_GOODS'
    CASH = 'CASH'
    CUSTOM = 'CUSTOM'


class AttemptStatus(str, enum.Enum):
    INFO = 'info'
    SUCCEEDED = 'succeeded'
    FAILED = 'failed'


class DayOfWeek(str, enum.Enum):
    MON = 'mon'
    TUE = 'tue'
    WED = 'wed'
    THU = 'thu'
    FRI = 'fri'
    SAT = 'sat'
    SUN = 'sun'


class ExpenseNotificationType(str, enum.Enum):
    PAYMENT_FAILED = 'payment_failed'
    AWAITING_CONFIRMATION = 'awaiting_confirmation'
    ALL_RETRIES_EXHAUSTED = 'all_retries_exhausted'
    AUTO_SKIPPED = 'auto_skipped'
    PAYMENT_SUCCEEDED = 'payment_succeeded'
    UPCOMING_PAYMENT = 'upcoming_payment'


class ExpenseStatus(str, enum.Enum):
    ACTIVE = 'active'
    PAUSED = 'paused'
    ARCHIVED = 'archived'


class HawlStatus(str, enum.Enum):
    ACTIVE = 'ACTIVE'
    BROKEN = 'BROKEN'
    COMPLETED = 'COMPLETED'
    PENDING = 'PENDING'


class MarsaAttemptStatus(str, enum.Enum):
    INFO = 'info'
    SUCCEEDED = 'succeeded'
    FAILED = 'failed'


class MarsaFrequency(str, enum.Enum):
    WEEKLY = 'weekly'
    BIWEEKLY = 'biweekly'
    MONTHLY = 'monthly'


class MarsaNotificationType(str, enum.Enum):
    DEPOSIT_FAILED = 'deposit_failed'
    ALL_RETRIES_EXHAUSTED = 'all_retries_exhausted'
    GOAL_REACHED = 'goal_reached'
    MILESTONE_REACHED = 'milestone_reached'
    UPCOMING_DEPOSIT = 'upcoming_deposit'


class MarsaStatus(str, enum.Enum):
    ACTIVE = 'active'
    PAUSED = 'paused'
    REACHED = 'reached'
    CANCELLED = 'cancelled'
    ARCHIVED = 'archived'


class MarsaTxStatus(str, enum.Enum):
    SCHEDULED = 'scheduled'
    PROCESSING = 'processing'
    RETRYING = 'retrying'
    SUCCEEDED = 'succeeded'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


class MarsaTxType(str, enum.Enum):
    AUTO_DEBIT = 'auto_debit'
    MANUAL_TOPUP = 'manual_topup'
    WITHDRAWAL = 'withdrawal'
    RELEASE = 'release'


class NisabStandard(str, enum.Enum):
    SILVER = 'SILVER'
    GOLD = 'GOLD'


class NotificationChannel(str, enum.Enum):
    PUSH = 'push'
    EMAIL = 'email'
    SMS = 'sms'
    IN_APP = 'in_app'


class PaymentMode(str, enum.Enum):
    AUTO = 'auto'
    MANUAL = 'manual'


class PaymentStatus(str, enum.Enum):
    PENDING = 'PENDING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'


class ScheduleUnit(str, enum.Enum):
    DAY = 'day'
    WEEK = 'week'
    MONTH = 'month'


class TransactionStatus(str, enum.Enum):
    SCHEDULED = 'scheduled'
    AWAITING_CONFIRMATION = 'awaiting_confirmation'
    PROCESSING = 'processing'
    RETRYING = 'retrying'
    SUCCEEDED = 'succeeded'
    FAILED = 'failed'
    SKIPPED = 'skipped'


class NisabPriceHistory(Base):
    __tablename__ = 'nisab_price_history'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='nisab_price_history_pkey'),
        UniqueConstraint('price_date', name='nisab_price_history_price_date_key'),
        Index('idx_nisab_price_history_date', 'price_date')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    price_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    gold_price_per_gram: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    gold_nisab_grams: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('85'))
    gold_nisab_value_sar: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    silver_price_per_gram: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    silver_nisab_grams: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('595'))
    silver_nisab_value_sar: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'goldapi'::text"))
    fetched_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    raw_response: Mapped[Optional[dict]] = mapped_column(JSONB)


t_pg_stat_statements = Table(
    'pg_stat_statements', Base.metadata,
    Column('userid', OID),
    Column('dbid', OID),
    Column('toplevel', Boolean),
    Column('queryid', BigInteger),
    Column('query', Text),
    Column('plans', BigInteger),
    Column('total_plan_time', Double(53)),
    Column('min_plan_time', Double(53)),
    Column('max_plan_time', Double(53)),
    Column('mean_plan_time', Double(53)),
    Column('stddev_plan_time', Double(53)),
    Column('calls', BigInteger),
    Column('total_exec_time', Double(53)),
    Column('min_exec_time', Double(53)),
    Column('max_exec_time', Double(53)),
    Column('mean_exec_time', Double(53)),
    Column('stddev_exec_time', Double(53)),
    Column('rows', BigInteger),
    Column('shared_blks_hit', BigInteger),
    Column('shared_blks_read', BigInteger),
    Column('shared_blks_dirtied', BigInteger),
    Column('shared_blks_written', BigInteger),
    Column('local_blks_hit', BigInteger),
    Column('local_blks_read', BigInteger),
    Column('local_blks_dirtied', BigInteger),
    Column('local_blks_written', BigInteger),
    Column('temp_blks_read', BigInteger),
    Column('temp_blks_written', BigInteger),
    Column('shared_blk_read_time', Double(53)),
    Column('shared_blk_write_time', Double(53)),
    Column('local_blk_read_time', Double(53)),
    Column('local_blk_write_time', Double(53)),
    Column('temp_blk_read_time', Double(53)),
    Column('temp_blk_write_time', Double(53)),
    Column('wal_records', BigInteger),
    Column('wal_fpi', BigInteger),
    Column('wal_bytes', Numeric),
    Column('jit_functions', BigInteger),
    Column('jit_generation_time', Double(53)),
    Column('jit_inlining_count', BigInteger),
    Column('jit_inlining_time', Double(53)),
    Column('jit_optimization_count', BigInteger),
    Column('jit_optimization_time', Double(53)),
    Column('jit_emission_count', BigInteger),
    Column('jit_emission_time', Double(53)),
    Column('jit_deform_count', BigInteger),
    Column('jit_deform_time', Double(53)),
    Column('stats_since', DateTime(True)),
    Column('minmax_stats_since', DateTime(True))
)


t_pg_stat_statements_info = Table(
    'pg_stat_statements_info', Base.metadata,
    Column('dealloc', BigInteger),
    Column('stats_reset', DateTime(True))
)


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='users_pkey'),
        UniqueConstraint('email', name='users_email_key')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))

    ai_recommendations: Mapped[list['AiRecommendations']] = relationship('AiRecommendations', back_populates='user')
    banks: Mapped[list['Banks']] = relationship('Banks', back_populates='user')
    zakat_assets: Mapped[list['ZakatAssets']] = relationship('ZakatAssets', back_populates='user')
    zakat_liabilities: Mapped[list['ZakatLiabilities']] = relationship('ZakatLiabilities', back_populates='user')
    zakat_payment_receivers: Mapped[list['ZakatPaymentReceivers']] = relationship('ZakatPaymentReceivers', back_populates='user')
    user_zakat_settings: Mapped['UserZakatSettings'] = relationship('UserZakatSettings', uselist=False, back_populates='user')
    zakat_asset_history: Mapped[list['ZakatAssetHistory']] = relationship('ZakatAssetHistory', back_populates='user')
    marasi: Mapped[list['Marasi']] = relationship('Marasi', back_populates='user')
    recurring_expenses: Mapped[list['RecurringExpenses']] = relationship('RecurringExpenses', back_populates='user')
    hawl_daily_checks: Mapped[list['HawlDailyChecks']] = relationship('HawlDailyChecks', back_populates='user')
    marasi_transactions: Mapped[list['MarasiTransactions']] = relationship('MarasiTransactions', back_populates='user')
    payment_transactions: Mapped[list['PaymentTransactions']] = relationship('PaymentTransactions', back_populates='user')
    zakat_calculations: Mapped[list['ZakatCalculations']] = relationship('ZakatCalculations', back_populates='user')
    expense_notifications: Mapped[list['ExpenseNotifications']] = relationship('ExpenseNotifications', back_populates='user')
    marasi_notifications: Mapped[list['MarasiNotifications']] = relationship('MarasiNotifications', back_populates='user')


class AiRecommendations(Base):
    __tablename__ = 'ai_recommendations'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='ai_recommendations_user_id_fkey'),
        PrimaryKeyConstraint('id', name='ai_recommendations_pkey'),
        Index('idx_ai_recommendations_user', 'user_id', 'created_at')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    recommendation_type: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(Text, nullable=False)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    message: Mapped[Optional[str]] = mapped_column(Text)
    action: Mapped[Optional[str]] = mapped_column(String(50))
    action_params: Mapped[Optional[dict]] = mapped_column(JSON)
    is_applied: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    applied_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    user: Mapped['Users'] = relationship('Users', back_populates='ai_recommendations')


class Banks(Base):
    __tablename__ = 'banks'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='banks_user_id_fkey'),
        PrimaryKeyConstraint('id', name='banks_pkey'),
        Index('banks_user_id_bank_id_key', 'user_id', 'bank_id', unique=True),
        Index('idx_banks_user', 'user_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    bank_id: Mapped[str] = mapped_column(Text, nullable=False)
    bank_name: Mapped[str] = mapped_column(Text, nullable=False)
    is_connected: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    connected_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    bank_name_ar: Mapped[Optional[str]] = mapped_column(Text)
    bank_code: Mapped[Optional[str]] = mapped_column(Text)
    logo_url: Mapped[Optional[str]] = mapped_column(Text)
    bank_type: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['Users'] = relationship('Users', back_populates='banks')
    accounts: Mapped[list['Accounts']] = relationship('Accounts', back_populates='bank')


class ZakatAssets(Base):
    __tablename__ = 'zakat_assets'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='zakat_assets_user_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_assets_pkey'),
        Index('idx_zakat_assets_owned', 'user_id', 'owned_since'),
        Index('idx_zakat_assets_user', 'user_id', 'status')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(Enum(AssetType, values_callable=lambda cls: [member.value for member in cls], name='asset_type'), nullable=False)
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'SAR'::text"))
    owned_since: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus, values_callable=lambda cls: [member.value for member in cls], name='asset_status'), nullable=False, server_default=text("'ACTIVE'::asset_status"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    custom_label: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    weight_grams: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 3))
    karat: Mapped[Optional[int]] = mapped_column(Integer)
    owned_until: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    user: Mapped['Users'] = relationship('Users', back_populates='zakat_assets')
    zakat_asset_history: Mapped[list['ZakatAssetHistory']] = relationship('ZakatAssetHistory', back_populates='asset')
    zakat_calculation_assets: Mapped[list['ZakatCalculationAssets']] = relationship('ZakatCalculationAssets', back_populates='asset')


class ZakatLiabilities(Base):
    __tablename__ = 'zakat_liabilities'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='zakat_liabilities_user_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_liabilities_pkey'),
        Index('idx_zakat_liabilities_user', 'user_id', 'is_settled')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'SAR'::text"))
    is_settled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    due_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['Users'] = relationship('Users', back_populates='zakat_liabilities')


class ZakatPaymentReceivers(Base):
    __tablename__ = 'zakat_payment_receivers'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='zakat_payment_receivers_user_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_payment_receivers_pkey'),
        Index('idx_zakat_payment_receivers_user', 'user_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    iban: Mapped[str] = mapped_column(Text, nullable=False)
    account_name: Mapped[str] = mapped_column(Text, nullable=False)
    is_charity: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    bank_name: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['Users'] = relationship('Users', back_populates='zakat_payment_receivers')
    user_zakat_settings: Mapped[list['UserZakatSettings']] = relationship('UserZakatSettings', back_populates='auto_pay_receiver')
    zakat_payments: Mapped[list['ZakatPayments']] = relationship('ZakatPayments', back_populates='receiver')


class Accounts(Base):
    __tablename__ = 'accounts'
    __table_args__ = (
        ForeignKeyConstraint(['bank_id'], ['banks.id'], ondelete='CASCADE', name='accounts_bank_id_fkey'),
        PrimaryKeyConstraint('id', name='accounts_pkey'),
        Index('idx_accounts_bank', 'bank_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    bank_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    account_id: Mapped[str] = mapped_column(Text, nullable=False)
    account_number: Mapped[str] = mapped_column(Text, nullable=False)
    account_type: Mapped[str] = mapped_column(Text, nullable=False)
    balance: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text('0'))
    currency: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'SAR'::text"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'), comment='false = soft-disconnected by user; row kept for historical FK integrity')
    account_name: Mapped[Optional[str]] = mapped_column(Text)
    iban: Mapped[Optional[str]] = mapped_column(Text)

    bank: Mapped['Banks'] = relationship('Banks', back_populates='accounts')
    marasi_account: Mapped[list['Marasi']] = relationship('Marasi', foreign_keys='[Marasi.account_id]', back_populates='account')
    marasi_release_account: Mapped[list['Marasi']] = relationship('Marasi', foreign_keys='[Marasi.release_account_id]', back_populates='release_account')
    recurring_expenses: Mapped[list['RecurringExpenses']] = relationship('RecurringExpenses', back_populates='account')
    marasi_transactions: Mapped[list['MarasiTransactions']] = relationship('MarasiTransactions', back_populates='account')
    payment_transactions: Mapped[list['PaymentTransactions']] = relationship('PaymentTransactions', back_populates='account')
    zakat_payments: Mapped[list['ZakatPayments']] = relationship('ZakatPayments', back_populates='account')


class UserZakatSettings(Base):
    __tablename__ = 'user_zakat_settings'
    __table_args__ = (
        ForeignKeyConstraint(['auto_pay_receiver_id'], ['zakat_payment_receivers.id'], ondelete='SET NULL', name='user_zakat_settings_auto_pay_receiver_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='user_zakat_settings_user_id_fkey'),
        PrimaryKeyConstraint('id', name='user_zakat_settings_pkey'),
        UniqueConstraint('user_id', name='user_zakat_settings_user_id_key')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    nisab_standard: Mapped[NisabStandard] = mapped_column(Enum(NisabStandard, values_callable=lambda cls: [member.value for member in cls], name='nisab_standard'), nullable=False, server_default=text("'SILVER'::nisab_standard"))
    nisab_standard_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    previous_net_balance: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text('0'))
    is_setup_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    auto_pay_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    nisab_locked_until: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    money_collected_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    last_zakat_payment_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    auto_pay_receiver_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    auto_pay_receiver: Mapped[Optional['ZakatPaymentReceivers']] = relationship('ZakatPaymentReceivers', back_populates='user_zakat_settings')
    user: Mapped['Users'] = relationship('Users', back_populates='user_zakat_settings')
    zakat_hawl: Mapped[list['ZakatHawl']] = relationship('ZakatHawl', back_populates='user')
    zakat_payments: Mapped[list['ZakatPayments']] = relationship('ZakatPayments', back_populates='user')


class ZakatAssetHistory(Base):
    __tablename__ = 'zakat_asset_history'
    __table_args__ = (
        ForeignKeyConstraint(['asset_id'], ['zakat_assets.id'], ondelete='CASCADE', name='zakat_asset_history_asset_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='zakat_asset_history_user_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_asset_history_pkey'),
        Index('idx_zakat_asset_history_asset', 'asset_id'),
        Index('idx_zakat_asset_history_user', 'user_id', 'action_at')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    asset_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    action: Mapped[AssetHistoryAction] = mapped_column(Enum(AssetHistoryAction, values_callable=lambda cls: [member.value for member in cls], name='asset_history_action'), nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    action_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    change_note: Mapped[Optional[str]] = mapped_column(Text)

    asset: Mapped['ZakatAssets'] = relationship('ZakatAssets', back_populates='zakat_asset_history')
    user: Mapped['Users'] = relationship('Users', back_populates='zakat_asset_history')


class Marasi(Base):
    __tablename__ = 'marasi'
    __table_args__ = (
        CheckConstraint('failed_attempts >= 0', name='marasi_failed_attempts_check'),
        CheckConstraint('length(title) >= 1 AND length(title) <= 100', name='marasi_title_check'),
        CheckConstraint('periodic_amount <= target_amount', name='periodic_not_exceeding_target'),
        CheckConstraint('periodic_amount > 0::numeric', name='marasi_periodic_amount_check'),
        CheckConstraint("status <> 'active'::marsa_status OR withdrawn = false", name='active_implies_not_withdrawn'),
        CheckConstraint("status <> 'cancelled'::marsa_status OR withdrawn = true", name='cancelled_implies_withdrawn'),
        CheckConstraint("status = 'cancelled'::marsa_status AND cancelled_at IS NOT NULL OR status <> 'cancelled'::marsa_status AND cancelled_at IS NULL", name='cancelled_at_iff_cancelled'),
        CheckConstraint("status = 'paused'::marsa_status AND paused_at IS NOT NULL OR status <> 'paused'::marsa_status AND paused_at IS NULL", name='paused_at_iff_paused'),
        CheckConstraint("status = 'reached'::marsa_status AND reached_at IS NOT NULL OR status <> 'reached'::marsa_status AND reached_at IS NULL", name='reached_at_iff_reached'),
        CheckConstraint('target_amount > 0::numeric', name='marasi_target_amount_check'),
        CheckConstraint('withdrawn = true AND withdrawn_at IS NOT NULL AND release_account_id IS NOT NULL OR withdrawn = false AND withdrawn_at IS NULL AND release_account_id IS NULL', name='withdrawn_at_iff_withdrawn'),
        ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT', name='marasi_account_id_fkey'),
        ForeignKeyConstraint(['release_account_id'], ['accounts.id'], ondelete='SET NULL', name='marasi_release_account_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='marasi_user_id_fkey'),
        PrimaryKeyConstraint('id', name='marasi_pkey'),
        Index('idx_marasi_account', 'account_id'),
        Index('idx_marasi_active', 'status', postgresql_where="(status = 'active'::marsa_status)"),
        Index('idx_marasi_due', 'next_deposit_at', postgresql_where="((status = 'active'::marsa_status) AND (next_deposit_at IS NOT NULL))"),
        Index('idx_marasi_release_account', 'release_account_id', postgresql_where='(release_account_id IS NOT NULL)'),
        Index('idx_marasi_user', 'user_id'),
        {'comment': 'The savings goal (intent). Each row references the linked_account '
                'that funds its auto-debits. Generates many marasi_transactions '
                'over time — one per scheduled deposit cycle plus any manual '
                'top-ups or withdrawals.'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, comment='The user-linked bank account auto-debits pull from. ON DELETE RESTRICT prevents accidentally orphaning an active Marsa when a bank is unlinked — the user must pause/archive the Marsa or switch its funding source first.')
    title: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False, comment='The total amount the user wants saved. Immutable in spirit — editing target should typically create a re-plan event rather than silently change history.')
    periodic_amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False, comment='Computed at creation as ceil((target_amount − current_balance) / number_of_cycles_until_target_date). Re-computed when the user changes target_amount, target_date, or frequency. The last cycle may debit a smaller "remainder" amount — handled at execution time, not stored here.')
    frequency: Mapped[MarsaFrequency] = mapped_column(Enum(MarsaFrequency, values_callable=lambda cls: [member.value for member in cls], name='marsa_frequency'), nullable=False, comment='How often auto-debits run. weekly / biweekly / monthly. Used together with target_date to derive periodic_amount and next_deposit_at.')
    target_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, comment='When the user wants the goal reached. The scheduler stops generating cycles past this date; if the goal is still short, the user is prompted to extend or top up.')
    current_balance: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text('0'))
    status: Mapped[MarsaStatus] = mapped_column(Enum(MarsaStatus, values_callable=lambda cls: [member.value for member in cls], name='marsa_status'), nullable=False, server_default=text("'active'::marsa_status"), comment='active = generating cycles. paused = stop cycling but keep history; can be resumed. reached = balance ≥ target_amount, set automatically. cancelled = user gave up; funds released. archived = soft-deleted from default views.')
    failed_attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'), comment='Count of consecutive failed auto-debit attempts on the most recent cycle. Reset to 0 on the next successful deposit (auto or manual). Drives the "Action needed" UI badge and triggers the all_retries_exhausted notification when it hits 3.')
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    withdrawn: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'), comment="Whether the goal's segregated balance has been transferred back to a bank account. Always FALSE for active goals; set TRUE in the same $transaction that creates a successful release tx (either after reaching the goal, or as part of a cancel).")
    next_deposit_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), comment="Pre-computed timestamp of the next scheduled auto-debit. NULL when status is not active. Indexed to power the scheduler's due-jobs query.")
    paused_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    reached_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    cancelled_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    withdrawn_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), comment='Timestamp of the release that emptied the balance. Mirrors the executed_at of the `release`-type marasi_transactions row.')
    release_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, comment="The user-linked account funds were transferred to. May differ from the goal's funding `account_id` — the user picks the destination at release time. ON DELETE SET NULL: we lose the destination pointer if the bank is unlinked, but the historical release tx itself is preserved.")

    account: Mapped['Accounts'] = relationship('Accounts', foreign_keys=[account_id], back_populates='marasi_account')
    release_account: Mapped[Optional['Accounts']] = relationship('Accounts', foreign_keys=[release_account_id], back_populates='marasi_release_account')
    user: Mapped['Users'] = relationship('Users', back_populates='marasi')
    marasi_transactions: Mapped[list['MarasiTransactions']] = relationship('MarasiTransactions', back_populates='marsa')
    marasi_notifications: Mapped[list['MarasiNotifications']] = relationship('MarasiNotifications', back_populates='marsa')


class RecurringExpenses(Base):
    __tablename__ = 'recurring_expenses'
    __table_args__ = (
        CheckConstraint('"interval" >= 1', name='recurring_expenses_interval_check'),
        CheckConstraint("amount_type = 'fixed'::amount_type AND amount IS NOT NULL OR amount_type = 'variable'::amount_type AND amount IS NULL", name='amount_required_when_fixed'),
        CheckConstraint('day_of_month >= 1 AND day_of_month <= 31', name='recurring_expenses_day_of_month_check'),
        CheckConstraint('description IS NULL OR length(description) <= 500', name='recurring_expenses_description_check'),
        CheckConstraint('length(title) >= 1 AND length(title) <= 100', name='recurring_expenses_title_check'),
        CheckConstraint("unit = 'month'::schedule_unit AND day_of_month IS NOT NULL OR unit <> 'month'::schedule_unit AND day_of_month IS NULL", name='day_of_month_only_when_monthly'),
        CheckConstraint("unit = 'week'::schedule_unit AND day_of_week IS NOT NULL OR unit <> 'week'::schedule_unit AND day_of_week IS NULL", name='day_of_week_only_when_weekly'),
        ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT', name='recurring_expenses_account_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='recurring_expenses_user_id_fkey'),
        PrimaryKeyConstraint('id', name='recurring_expenses_pkey'),
        Index('idx_recurring_expenses_account', 'account_id'),
        Index('idx_recurring_expenses_active', 'status', postgresql_where="(status = 'active'::expense_status)"),
        Index('idx_recurring_expenses_user', 'user_id'),
        {'comment': 'The recurrence rule (intent). Each row spawns many '
                'payment_transactions over time.'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, comment='The user-linked account this expense is paid from. ON DELETE RESTRICT prevents accidentally orphaning expenses when a bank is unlinked — the user must archive/delete the expense first.')
    title: Mapped[str] = mapped_column(Text, nullable=False)
    amount_type: Mapped[AmountType] = mapped_column(Enum(AmountType, values_callable=lambda cls: [member.value for member in cls], name='amount_type'), nullable=False)
    unit: Mapped[ScheduleUnit] = mapped_column(Enum(ScheduleUnit, values_callable=lambda cls: [member.value for member in cls], name='schedule_unit'), nullable=False)
    interval: Mapped[int] = mapped_column(Integer, nullable=False)
    time_of_day: Mapped[datetime.time] = mapped_column(Time, nullable=False, comment="Local time the payment should fire. Stored as TIME (no timezone). Combined with the user's timezone at scheduling time.")
    payment_mode: Mapped[PaymentMode] = mapped_column(Enum(PaymentMode, values_callable=lambda cls: [member.value for member in cls], name='payment_mode'), nullable=False, server_default=text("'auto'::payment_mode"), comment='auto = charge on schedule without prompting. manual = notify user each cycle and require approval before debit. Manual cycles auto-skip after 24h of no response.')
    status: Mapped[ExpenseStatus] = mapped_column(Enum(ExpenseStatus, values_callable=lambda cls: [member.value for member in cls], name='expense_status'), nullable=False, server_default=text("'active'::expense_status"), comment='active = generating cycles. paused = stop generating but keep history. archived = soft-deleted.')
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), comment='Required when amount_type = fixed; must be NULL when amount_type = variable. Variable amounts are entered by the user each cycle on the awaiting_confirmation transaction.')
    day_of_week: Mapped[Optional[DayOfWeek]] = mapped_column(Enum(DayOfWeek, values_callable=lambda cls: [member.value for member in cls], name='day_of_week'), comment='Only set when unit = week; otherwise NULL (enforced by check constraint).')
    day_of_month: Mapped[Optional[int]] = mapped_column(Integer, comment='Only set when unit = month (1-31). If the chosen day does not exist in a given month (e.g. 31 in February, or 30/31 in shorter months), the payment runs on the closest earlier day that exists — i.e. the last available day of that month. Example: day_of_month = 31 executes on Feb 28 (or 29 in leap years), Apr 30, Jun 30, Sep 30, Nov 30. The original value is preserved here; the scheduler resolves the actual execution date at run time. The user is shown a note about this behavior in the wizard.')

    account: Mapped['Accounts'] = relationship('Accounts', back_populates='recurring_expenses')
    user: Mapped['Users'] = relationship('Users', back_populates='recurring_expenses')
    payment_transactions: Mapped[list['PaymentTransactions']] = relationship('PaymentTransactions', back_populates='recurring_expense')


class ZakatHawl(Base):
    __tablename__ = 'zakat_hawl'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['user_zakat_settings.user_id'], ondelete='CASCADE', name='zakat_hawl_user_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_hawl_pkey'),
        Index('idx_zakat_hawl_user', 'user_id', 'status')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    status: Mapped[HawlStatus] = mapped_column(Enum(HawlStatus, values_callable=lambda cls: [member.value for member in cls], name='hawl_status'), nullable=False, server_default=text("'PENDING'::hawl_status"))
    start_date: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    expected_end_date: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    nisab_standard: Mapped[NisabStandard] = mapped_column(Enum(NisabStandard, values_callable=lambda cls: [member.value for member in cls], name='nisab_standard'), nullable=False)
    balance_at_start: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    broken_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    break_reason: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['UserZakatSettings'] = relationship('UserZakatSettings', back_populates='zakat_hawl')
    hawl_daily_checks: Mapped[list['HawlDailyChecks']] = relationship('HawlDailyChecks', back_populates='hawl')
    zakat_calculations: Mapped[list['ZakatCalculations']] = relationship('ZakatCalculations', back_populates='hawl')


class HawlDailyChecks(Base):
    __tablename__ = 'hawl_daily_checks'
    __table_args__ = (
        ForeignKeyConstraint(['hawl_id'], ['zakat_hawl.id'], ondelete='CASCADE', name='hawl_daily_checks_hawl_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='hawl_daily_checks_user_id_fkey'),
        PrimaryKeyConstraint('id', name='hawl_daily_checks_pkey'),
        UniqueConstraint('hawl_id', 'check_date', name='hawl_daily_checks_hawl_id_check_date_key'),
        Index('idx_hawl_daily_checks_user', 'user_id', 'check_date')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    hawl_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    check_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    bank_balance: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    manual_assets_total: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    total_net_worth: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    nisab_value_sar: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    gold_price_per_gram: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    silver_price_per_gram: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    is_above_nisab: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))

    hawl: Mapped['ZakatHawl'] = relationship('ZakatHawl', back_populates='hawl_daily_checks')
    user: Mapped['Users'] = relationship('Users', back_populates='hawl_daily_checks')


class MarasiTransactions(Base):
    __tablename__ = 'marasi_transactions'
    __table_args__ = (
        CheckConstraint('amount > 0::numeric', name='marasi_transactions_amount_check'),
        CheckConstraint('retry_count >= 0 AND retry_count <= 3', name='marasi_transactions_retry_count_check'),
        CheckConstraint("type = 'auto_debit'::marsa_tx_type AND scheduled_for IS NOT NULL OR type <> 'auto_debit'::marsa_tx_type", name='scheduled_for_required_for_auto_debit'),
        ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT', name='marasi_transactions_account_id_fkey'),
        ForeignKeyConstraint(['marsa_id'], ['marasi.id'], ondelete='CASCADE', name='marasi_transactions_marsa_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='marasi_transactions_user_id_fkey'),
        PrimaryKeyConstraint('id', name='marasi_transactions_pkey'),
        Index('idx_marasi_transactions_account', 'account_id'),
        Index('idx_marasi_transactions_marsa', 'marsa_id', 'created_at'),
        Index('idx_marasi_transactions_pending', 'scheduled_for', postgresql_where="(status = ANY (ARRAY['scheduled'::marsa_tx_status, 'processing'::marsa_tx_status, 'retrying'::marsa_tx_status]))"),
        Index('idx_marasi_transactions_scheduled', 'scheduled_for'),
        Index('idx_marasi_transactions_status', 'status'),
        Index('idx_marasi_transactions_user', 'user_id'),
        {'comment': 'Every money movement for a savings goal. One row per scheduled '
                'auto-debit cycle, manual top-up, withdrawal, or final release. '
                'Snapshot fields preserve the source account at execution time so '
                "history stays accurate even if the Marsa's linked account changes "
                'or is unlinked later.'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    marsa_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, comment='Denormalized from marasi for fast RLS and per-user queries. Set once on insert; never changes.')
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    type: Mapped[MarsaTxType] = mapped_column(Enum(MarsaTxType, values_callable=lambda cls: [member.value for member in cls], name='marsa_tx_type'), nullable=False, comment='auto_debit = scheduled bank → goal. manual_topup = user-initiated. withdrawal = user pulls money before goal completes. release = automatic on goal cancellation or completion.')
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False, comment='Always positive. Direction is implied by type: auto_debit/manual_topup add to the goal, withdrawal/release subtract from it.')
    status: Mapped[MarsaTxStatus] = mapped_column(Enum(MarsaTxStatus, values_callable=lambda cls: [member.value for member in cls], name='marsa_tx_status'), nullable=False, server_default=text("'scheduled'::marsa_tx_status"))
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'), comment="0 = initial attempt. 1-3 = automatic retries (every 3 hours by default). After retry_count = 3 the status flips to 'failed' and an all_retries_exhausted notification is sent.")
    resolved_manually: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'), comment='TRUE if a previously failed transaction was paid through the user-triggered Retry flow (possibly funded from a different account). Distinguishes user-resolved failures from successful first attempts when reading history.')
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    scheduled_for: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), comment='When the cycle is meant to fire. Required for auto_debit; NULL for instant types (manual_topup, withdrawal, release execute immediately).')
    executed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), comment='When money actually moved. NULL until the row reaches succeeded; remains NULL on failed/cancelled rows.')
    bank_ref: Mapped[Optional[str]] = mapped_column(Text, comment="Bank-issued reference returned by the gateway on success. NULL otherwise. Links this row to the bank's own ledger entry.")
    failure_reason: Mapped[Optional[str]] = mapped_column(Text)
    note: Mapped[Optional[str]] = mapped_column(Text)

    account: Mapped['Accounts'] = relationship('Accounts', back_populates='marasi_transactions')
    marsa: Mapped['Marasi'] = relationship('Marasi', back_populates='marasi_transactions')
    user: Mapped['Users'] = relationship('Users', back_populates='marasi_transactions')
    marasi_attempts: Mapped[list['MarasiAttempts']] = relationship('MarasiAttempts', back_populates='transaction')
    marasi_notifications: Mapped[list['MarasiNotifications']] = relationship('MarasiNotifications', back_populates='transaction')


class PaymentTransactions(Base):
    __tablename__ = 'payment_transactions'
    __table_args__ = (
        CheckConstraint('retry_count >= 0 AND retry_count <= 3', name='payment_transactions_retry_count_check'),
        ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT', name='payment_transactions_account_id_fkey'),
        ForeignKeyConstraint(['recurring_expense_id'], ['recurring_expenses.id'], ondelete='CASCADE', name='payment_transactions_recurring_expense_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='payment_transactions_user_id_fkey'),
        PrimaryKeyConstraint('id', name='payment_transactions_pkey'),
        Index('idx_payment_transactions_expense', 'recurring_expense_id'),
        Index('idx_payment_transactions_pending', 'scheduled_for', postgresql_where="(status = ANY (ARRAY['scheduled'::transaction_status, 'awaiting_confirmation'::transaction_status, 'retrying'::transaction_status]))"),
        Index('idx_payment_transactions_scheduled', 'scheduled_for'),
        Index('idx_payment_transactions_status', 'status'),
        Index('idx_payment_transactions_user', 'user_id'),
        {'comment': 'A single billing cycle (the execution). One recurring_expense → '
                'many payment_transactions over time. Snapshot fields preserve the '
                'source account at execution time so history stays accurate even '
                "if the rule's linked account changes later."}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    recurring_expense_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, comment='Denormalized from recurring_expenses for fast RLS and per-user queries. Set once on insert; never changes.')
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    scheduled_for: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, comment='When the payment is meant to fire. For day_of_month rules, this is already resolved (e.g. Feb 28 instead of Feb 31).')
    status: Mapped[TransactionStatus] = mapped_column(Enum(TransactionStatus, values_callable=lambda cls: [member.value for member in cls], name='transaction_status'), nullable=False, server_default=text("'scheduled'::transaction_status"))
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'), comment="0 = initial attempt only. 1-3 = automatic retries (every 3 hours). After retry_count = 3 the status flips to 'failed'.")
    resolved_manually: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'), comment='TRUE if a previously failed transaction was paid through the Resolve flow (i.e. user manually re-ran the payment, possibly from a different account).')
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    executed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), comment='When the payment actually went through. NULL until succeeded or, for failures, may remain NULL.')
    amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2), comment='NULL until known. For variable expenses this is filled when the user enters the amount; for fixed it is copied from the rule at scheduling time.')
    bank_ref: Mapped[Optional[str]] = mapped_column(Text, comment="Bank-issued reference returned by the gateway on success. NULL otherwise. This is the link to the bank's own ledger (account_transactions.json).")
    failure_reason: Mapped[Optional[str]] = mapped_column(Text)
    note: Mapped[Optional[str]] = mapped_column(Text)

    account: Mapped['Accounts'] = relationship('Accounts', back_populates='payment_transactions')
    recurring_expense: Mapped['RecurringExpenses'] = relationship('RecurringExpenses', back_populates='payment_transactions')
    user: Mapped['Users'] = relationship('Users', back_populates='payment_transactions')
    expense_notifications: Mapped[list['ExpenseNotifications']] = relationship('ExpenseNotifications', back_populates='transaction')
    payment_attempts: Mapped[list['PaymentAttempts']] = relationship('PaymentAttempts', back_populates='transaction')


class ZakatCalculations(Base):
    __tablename__ = 'zakat_calculations'
    __table_args__ = (
        ForeignKeyConstraint(['hawl_id'], ['zakat_hawl.id'], ondelete='SET NULL', name='zakat_calculations_hawl_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='zakat_calculations_user_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_calculations_pkey'),
        Index('idx_zakat_calculations_user', 'user_id', 'calculated_at')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    nisab_standard: Mapped[NisabStandard] = mapped_column(Enum(NisabStandard, values_callable=lambda cls: [member.value for member in cls], name='nisab_standard'), nullable=False)
    nisab_value_sar: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    gold_price_per_gram: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    silver_price_per_gram: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    bank_balance_total: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    manual_assets_total: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    liabilities_total: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    net_worth: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    is_above_nisab: Mapped[bool] = mapped_column(Boolean, nullable=False)
    zakat_rate: Mapped[decimal.Decimal] = mapped_column(Numeric(5, 4), nullable=False, server_default=text('0.025'))
    calculated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    hawl_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    zakat_amount: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(15, 2))

    hawl: Mapped[Optional['ZakatHawl']] = relationship('ZakatHawl', back_populates='zakat_calculations')
    user: Mapped['Users'] = relationship('Users', back_populates='zakat_calculations')
    zakat_calculation_assets: Mapped[list['ZakatCalculationAssets']] = relationship('ZakatCalculationAssets', back_populates='calculation')
    zakat_payments: Mapped[Optional['ZakatPayments']] = relationship('ZakatPayments', uselist=False, back_populates='calculation')


class ExpenseNotifications(Base):
    __tablename__ = 'expense_notifications'
    __table_args__ = (
        ForeignKeyConstraint(['transaction_id'], ['payment_transactions.id'], ondelete='CASCADE', name='expense_notifications_transaction_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='expense_notifications_user_id_fkey'),
        PrimaryKeyConstraint('id', name='expense_notifications_pkey'),
        Index('idx_expense_notifications_unread', 'user_id', 'sent_at', postgresql_where='(read_at IS NULL)'),
        Index('idx_expense_notifications_user', 'user_id', 'sent_at'),
        {'comment': 'Outbound notifications. No updated_at — read_at is a one-shot '
                'write, not a generic mutation field.'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    type: Mapped[ExpenseNotificationType] = mapped_column(Enum(ExpenseNotificationType, values_callable=lambda cls: [member.value for member in cls], name='expense_notification_type'), nullable=False)
    channel: Mapped[NotificationChannel] = mapped_column(Enum(NotificationChannel, values_callable=lambda cls: [member.value for member in cls], name='notification_channel'), nullable=False)
    sent_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    read_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    transaction: Mapped[Optional['PaymentTransactions']] = relationship('PaymentTransactions', back_populates='expense_notifications')
    user: Mapped['Users'] = relationship('Users', back_populates='expense_notifications')


class MarasiAttempts(Base):
    __tablename__ = 'marasi_attempts'
    __table_args__ = (
        CheckConstraint('attempt_number >= 0', name='marasi_attempts_attempt_number_check'),
        CheckConstraint('length(message) <= 500', name='marasi_attempts_message_check'),
        ForeignKeyConstraint(['transaction_id'], ['marasi_transactions.id'], ondelete='CASCADE', name='marasi_attempts_transaction_id_fkey'),
        PrimaryKeyConstraint('id', name='marasi_attempts_pkey'),
        Index('idx_marasi_attempts_transaction', 'transaction_id', 'at'),
        {'comment': 'Immutable log: one row per gateway call or user action against a '
                'marasi_transaction. Powers the per-deposit timeline drilldown in '
                'the UI. Append-only — no updated_at column.'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    transaction_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, comment='0 = initial attempt. 1-3 = automatic retries. Manual resolutions and user-driven actions append with a fresh attempt_number after the auto-retry sequence.')
    at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    status: Mapped[MarsaAttemptStatus] = mapped_column(Enum(MarsaAttemptStatus, values_callable=lambda cls: [member.value for member in cls], name='marsa_attempt_status'), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False, comment='Human-readable log line shown to the user, e.g. "Declined by Al Rajhi: insufficient funds (balance SAR 540.00)".')
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    gateway_code: Mapped[Optional[str]] = mapped_column(Text, comment='Raw bank/gateway code (e.g. "INSUFFICIENT_FUNDS", "TIMEOUT"). Internal use; not shown to the user.')
    gateway_response: Mapped[Optional[dict]] = mapped_column(JSONB, comment='Full gateway payload for debugging. Internal use only.')

    transaction: Mapped['MarasiTransactions'] = relationship('MarasiTransactions', back_populates='marasi_attempts')


class MarasiNotifications(Base):
    __tablename__ = 'marasi_notifications'
    __table_args__ = (
        ForeignKeyConstraint(['marsa_id'], ['marasi.id'], ondelete='CASCADE', name='marasi_notifications_marsa_id_fkey'),
        ForeignKeyConstraint(['transaction_id'], ['marasi_transactions.id'], ondelete='CASCADE', name='marasi_notifications_transaction_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='marasi_notifications_user_id_fkey'),
        PrimaryKeyConstraint('id', name='marasi_notifications_pkey'),
        Index('idx_marasi_notifications_unread', 'user_id', 'sent_at', postgresql_where='(read_at IS NULL)'),
        Index('idx_marasi_notifications_user', 'user_id', 'sent_at'),
        {'comment': 'Outbound notifications scoped to the Marāsi module. No updated_at '
                '— read_at is a one-shot write, not a generic mutation field.'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    type: Mapped[MarsaNotificationType] = mapped_column(Enum(MarsaNotificationType, values_callable=lambda cls: [member.value for member in cls], name='marsa_notification_type'), nullable=False, comment='deposit_failed = single attempt failed. all_retries_exhausted = 3 retries done, status flipped to failed. goal_reached = balance hit target. milestone_reached = optional 25/50/75% progress nudges. upcoming_deposit = pre-debit reminder if user opted in.')
    channel: Mapped[NotificationChannel] = mapped_column(Enum(NotificationChannel, values_callable=lambda cls: [member.value for member in cls], name='notification_channel'), nullable=False)
    sent_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    marsa_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    read_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    marsa: Mapped[Optional['Marasi']] = relationship('Marasi', back_populates='marasi_notifications')
    transaction: Mapped[Optional['MarasiTransactions']] = relationship('MarasiTransactions', back_populates='marasi_notifications')
    user: Mapped['Users'] = relationship('Users', back_populates='marasi_notifications')


class PaymentAttempts(Base):
    __tablename__ = 'payment_attempts'
    __table_args__ = (
        CheckConstraint('attempt_number >= 0', name='payment_attempts_attempt_number_check'),
        CheckConstraint('length(message) <= 500', name='payment_attempts_message_check'),
        ForeignKeyConstraint(['transaction_id'], ['payment_transactions.id'], ondelete='CASCADE', name='payment_attempts_transaction_id_fkey'),
        PrimaryKeyConstraint('id', name='payment_attempts_pkey'),
        Index('idx_payment_attempts_transaction', 'transaction_id', 'at'),
        {'comment': 'Immutable log: one row per gateway call or user action. Powers '
                'the per-payment timeline drilldown. No updated_at — rows are '
                'append-only.'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    transaction_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, comment='0 = initial attempt. 1-3 = automatic retries. Manual resolutions / user actions also append here with a fresh attempt_number.')
    at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    status: Mapped[AttemptStatus] = mapped_column(Enum(AttemptStatus, values_callable=lambda cls: [member.value for member in cls], name='attempt_status'), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False, comment='Human-readable log line shown to the user, e.g. "Declined by Al Rajhi: insufficient funds (balance SAR 540.00)".')
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    gateway_code: Mapped[Optional[str]] = mapped_column(Text, comment='Raw bank/gateway code (e.g. "INSUFFICIENT_FUNDS", "TIMEOUT"). Internal use; not shown to the user.')
    gateway_response: Mapped[Optional[dict]] = mapped_column(JSONB, comment='Full gateway payload for debugging. Internal use only.')

    transaction: Mapped['PaymentTransactions'] = relationship('PaymentTransactions', back_populates='payment_attempts')


class ZakatCalculationAssets(Base):
    __tablename__ = 'zakat_calculation_assets'
    __table_args__ = (
        ForeignKeyConstraint(['asset_id'], ['zakat_assets.id'], ondelete='SET NULL', name='zakat_calculation_assets_asset_id_fkey'),
        ForeignKeyConstraint(['calculation_id'], ['zakat_calculations.id'], ondelete='CASCADE', name='zakat_calculation_assets_calculation_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_calculation_assets_pkey'),
        Index('idx_zakat_calculation_assets_calc', 'calculation_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    calculation_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    asset_type: Mapped[str] = mapped_column(Text, nullable=False)
    value_at_calc: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    is_zakatable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    asset_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    asset: Mapped[Optional['ZakatAssets']] = relationship('ZakatAssets', back_populates='zakat_calculation_assets')
    calculation: Mapped['ZakatCalculations'] = relationship('ZakatCalculations', back_populates='zakat_calculation_assets')


class ZakatPayments(Base):
    __tablename__ = 'zakat_payments'
    __table_args__ = (
        ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL', name='zakat_payments_account_id_fkey'),
        ForeignKeyConstraint(['calculation_id'], ['zakat_calculations.id'], ondelete='SET NULL', name='zakat_payments_calculation_id_fkey'),
        ForeignKeyConstraint(['receiver_id'], ['zakat_payment_receivers.id'], ondelete='SET NULL', name='zakat_payments_receiver_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['user_zakat_settings.user_id'], ondelete='CASCADE', name='zakat_payments_user_id_fkey'),
        PrimaryKeyConstraint('id', name='zakat_payments_pkey'),
        UniqueConstraint('calculation_id', name='zakat_payments_calculation_id_key'),
        Index('idx_zakat_payments_user', 'user_id', 'created_at')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'SAR'::text"))
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus, values_callable=lambda cls: [member.value for member in cls], name='payment_status'), nullable=False, server_default=text("'PENDING'::payment_status"))
    is_automated: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    calculation_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    receiver_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    to_iban: Mapped[Optional[str]] = mapped_column(Text)
    bank_reference: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    paid_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    account: Mapped[Optional['Accounts']] = relationship('Accounts', back_populates='zakat_payments')
    calculation: Mapped[Optional['ZakatCalculations']] = relationship('ZakatCalculations', back_populates='zakat_payments')
    receiver: Mapped[Optional['ZakatPaymentReceivers']] = relationship('ZakatPaymentReceivers', back_populates='zakat_payments')
    user: Mapped['UserZakatSettings'] = relationship('UserZakatSettings', back_populates='zakat_payments')
