var inherits = require('util').inherits;

function ColorCharacteristics(Characteristic) {
    const UUID_KELVIN = 'C4E24248-04AC-44AF-ACFF-40164E829DBA';

    this.ColorTemperatureInKelvin = function() {
        Characteristic.call(this, 'ColorTemperature in Kelvin', UUID_KELVIN)

        this.setProps({
            format: Characteristic.Formats.UINT16,
            unit: 'K',
            maxValue: 9000,
            minValue: 2500,
            minStep: 250,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });

        this.value = this.getDefaultValue();
    };
    inherits(this.ColorTemperatureInKelvin, Characteristic);

    this.ColorTemperatureInKelvin.UUID = UUID_KELVIN;

    return this;
}

module.exports.ColorCharacteristics = ColorCharacteristics;

function EnergyCharacteristics(Characteristic) {

    this.TotalConsumption = function() {
        Characteristic.call(this, 'Total Consumption (kWh*1000)', 'E863F10C-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: Characteristic.Units.SECONDS,
            maxValue: 4294967295,
            minValue: 0,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
        
        
    };
    inherits(this.TotalConsumption, Characteristic);

    this.CurrentConsumption = function() {
        Characteristic.call(this, 'Current Consumption (W*10)', 'E863F10D-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: Characteristic.Units.SECONDS,
            maxValue: 65535,
            minValue: 0,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(this.CurrentConsumption, Characteristic);
    
    return this;
}

module.exports.EnergyCharacteristics = EnergyCharacteristics;
