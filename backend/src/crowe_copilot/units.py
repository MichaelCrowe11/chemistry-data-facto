"""Unit handling with pint for chemistry and pharmacology."""

from __future__ import annotations

from pint import UnitRegistry

# Global unit registry
u = UnitRegistry()
Q_ = u.Quantity

# Canonical unit choices for pharmacology and chemistry
CONC = u.micromolar  # µM
MASS = u.milligram  # mg
VOL = u.milliliter  # mL
TEMP = u.degC  # °C
TIME = u.hour  # h
PRESSURE = u.bar  # bar
WAVELENGTH = u.nanometer  # nm
FREQUENCY = u.hertz  # Hz

# Common conversions
MOLAR_TO_MICROMOLAR = 1e6
GRAM_TO_MILLIGRAM = 1000
LITER_TO_MILLILITER = 1000


def parse_concentration(value: float, unit: str) -> Q_:
    """Parse concentration with unit validation."""
    return Q_(value, unit).to(CONC)


def parse_mass(value: float, unit: str) -> Q_:
    """Parse mass with unit validation."""
    return Q_(value, unit).to(MASS)


def parse_volume(value: float, unit: str) -> Q_:
    """Parse volume with unit validation."""
    return Q_(value, unit).to(VOL)


def parse_temperature(value: float, unit: str) -> Q_:
    """Parse temperature with unit validation."""
    return Q_(value, unit).to(TEMP)
