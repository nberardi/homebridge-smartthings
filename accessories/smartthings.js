var inherits = require('util').inherits;

var Accessory, Service, Characteristic, uuid, EnergyCharacteristics, ColorCharacteristics;

/*
 *   SmartThings Accessory
 */

module.exports = function(oAccessory, oService, oCharacteristic, ouuid) {
    if (oAccessory) {
        Accessory = oAccessory;
        Service = oService;
        Characteristic = oCharacteristic;
        EnergyCharacteristics = require('../lib/customCharacteristics').EnergyCharacteristics(Characteristic);
        ColorCharacteristics = require('../lib/customCharacteristics').ColorCharacteristics(Characteristic);

        // Categories = https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/Accessory.js#L88
        // Services = https://github.com/oznu/hap-client/blob/master/src/hap-types.ts#L3
        // Characteristics = https://github.com/oznu/hap-client/blob/master/src/hap-types.ts#L86

        uuid = ouuid;

        inherits(SmartThingsAccessory, Accessory);
        SmartThingsAccessory.prototype.loadData = loadData;
        SmartThingsAccessory.prototype.getServices = getServices;

    }
    return SmartThingsAccessory;
};
module.exports.SmartThingsAccessory = SmartThingsAccessory;

function SmartThingsAccessory(platform, device) {

    this.deviceid = device.deviceid;
    this.name = device.name;
    this.platform = platform;
    this.state = {};
    this.device = device;

    var idKey = 'hbdev:smartthings:' + this.deviceid;
    var id = uuid.generate(idKey);

    Accessory.call(this, this.name, id);

    this.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, device.manufacturerName)
        .setCharacteristic(Characteristic.Model, device.modelName)
        .setCharacteristic(Characteristic.SerialNumber, device.basename);

    var that = this;

    //Get the Capabilities List
    for (var index in device.capabilities) {
        if ((platform.knownCapabilities.indexOf(index) == -1) && (platform.unknownCapabilities.indexOf(index) == -1))
            platform.unknownCapabilities.push(index);
    }

    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/Accessory.js#L136
    this.getaddService = function(Service) {
        var myService = this.getService(Service);
        if (!myService) myService = this.addService(Service);
        return myService
    };

    this.deviceGroup = "unknown"; //This way we can easily tell if we set a device group
	var thisCharacteristic, thisService;

    if (device.capabilities["Switch"] !== undefined) {
        if (device.capabilities["Color Control"] !== undefined || device.capabilities["Color Temperature"] !== undefined || device.capabilities["Switch Level"] !== undefined) {
            thisService = this.getaddService(Service.Lightbulb);
            this.deviceGroup = "lights";
            this.category = Accessory.Categories.LIGHTBULB;
        } else if (device.capabilities["Outlet"] !== undefined){
            thisService = this.getaddService(Service.Outlet);
            this.deviceGroup = "outlet";
            this.category = Accessory.Categories.OUTLET;
        } else {           
            thisService = this.getaddService(Service.Switch);    
            this.deviceGroup = "switch";
            this.category = Accessory.Categories.SWITCH;
        }
        
        if (device.capabilities["Color Control"] !== undefined) {
            thisCharacteristic = thisService.getCharacteristic(Characteristic.Hue);
            thisCharacteristic.on('get', function(callback) { callback(null, Math.round(that.device.attributes.hue*3.6)); });
            thisCharacteristic.on('set', function(value, callback) { that.platform.api.runCommand(callback, that.deviceid, "setHue", { value1: Math.round(value/3.6) }); });
            that.platform.addAttributeUsage("hue", this.deviceid, thisCharacteristic);

            thisCharacteristic = thisService.getCharacteristic(Characteristic.Saturation);
            thisCharacteristic.on('get', function(callback) { callback(null, parseInt(that.device.attributes.saturation)); });
            thisCharacteristic.on('set', function(value, callback) { that.platform.api.runCommand(callback, that.deviceid, "setSaturation", { value1: value }); });
            that.platform.addAttributeUsage("saturation", this.deviceid, thisCharacteristic);
        }

        if (device.capabilities["Color Temperature"] !== undefined) {
            thisCharacteristic = thisService.getCharacteristic(Characteristic.ColorTemperature);
            thisCharacteristic.on('get', function(callback) { callback(null, Math.round(1/(that.device.attributes.colorTemperature/1000000))); });
            thisCharacteristic.on('set', function(value, callback) { that.platform.api.runCommand(callback, that.deviceid, "setColorTemperature", { value1: Math.round(1000000/value) }); });
            that.platform.addAttributeUsage("colorTemperature", this.deviceid, thisCharacteristic);
        }

        if (device.capabilities["Switch Level"] !== undefined) {
            thisCharacteristic = thisService.getCharacteristic(Characteristic.Brightness);
            thisCharacteristic.on('get', function(callback) { callback(null, parseInt(that.device.attributes.level)); });
            thisCharacteristic.on('set', function(value, callback) { that.platform.api.runCommand(callback, that.deviceid, "setLevel", { value1: value }); });
            that.platform.addAttributeUsage("level", this.deviceid, thisCharacteristic);
        } 

        if (device.capabilities["Outlet"] !== undefined) {    
            thisCharacteristic =  thisService.getCharacteristic(Characteristic.OutletInUse);
            thisCharacteristic.on('get', function(callback) { callback(null, that.device.attributes.power > 0); });
            that.platform.addAttributeUsage("power", this.deviceid, thisCharacteristic);
        }

        thisCharacteristic = thisService.getCharacteristic(Characteristic.On);
        thisCharacteristic.on('get', function(callback) { callback(null, that.device.attributes.switch == "on"); })
        thisCharacteristic.on('set', function(value, callback) {
                if (value)
                    that.platform.api.runCommand(callback, that.deviceid, "on");
                else
                    that.platform.api.runCommand(callback, that.deviceid, "off");
            });
        that.platform.addAttributeUsage("switch", this.deviceid, thisCharacteristic);
    }

    if (device.capabilities["Sensor"] !== undefined) {
        if (this.deviceGroup == 'unknown')  {
            this.deviceGroup = "sensor";
            this.category = Accessory.Categories.SENSOR;
        }

        if (device.capabilities["Temperature Measurement"] !== undefined) {
            thisService = this.getaddService(Service.TemperatureSensor);
            thisCharacteristic = thisService.getCharacteristic(Characteristic.CurrentTemperature)
            thisCharacteristic.on('get', function(callback) {
                    if (that.platform.temperature_unit == 'C')
                        callback(null, Math.round(that.device.attributes.temperature*10)/10);
                    else
                        callback(null, Math.round(((that.device.attributes.temperature - 32) / 1.8)*10)/10);
                });
            that.platform.addAttributeUsage("temperature", this.deviceid, thisCharacteristic);
        }

        if (device.capabilities["Contact Sensor"] !== undefined) {
            thisService = this.getaddService(Service.TemperatureSensor);
            thisCharacteristic = thisService.getCharacteristic(Characteristic.ContactSensorState)
            thisCharacteristic.on('get', function(callback) {
                    if (that.device.attributes.contact == "closed")
                        callback(null, Characteristic.ContactSensorState.CONTACT_DETECTED);
                    else
                        callback(null, Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);

                });
            that.platform.addAttributeUsage("contact", this.deviceid, thisCharacteristic);
        }
    }

    if (device.capabilities["Battery"] !== undefined) {
        thisService = this.getaddService(Service.BatteryService);

        thisCharacteristic = thisService.getCharacteristic(Characteristic.BatteryLevel)
        thisCharacteristic.on('get', function(callback) { callback(null, Math.round(that.device.attributes.battery)); });
		that.platform.addAttributeUsage("battery", this.deviceid, thisCharacteristic);

        thisCharacteristic = thisService.getCharacteristic(Characteristic.StatusLowBattery)
        thisCharacteristic.on('get', function(callback) {
                if (that.device.attributes.battery < 0.20)
                    callback(null, Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW);
                else
                    callback(null, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
            });

        thisService.setCharacteristic(Characteristic.ChargingState, Characteristic.ChargingState.NOT_CHARGING);
		that.platform.addAttributeUsage("battery", this.deviceid, thisCharacteristic);
    }

    if (device.capabilities["Energy Meter"] !== undefined && thisService !== undefined) {
        thisCharacteristic =  thisService.addCharacteristic(EnergyCharacteristics.TotalConsumption)
        thisCharacteristic.on('get', function(callback) { callback(null, Math.round(that.device.attributes.energy)); });
		that.platform.addAttributeUsage("energy", this.deviceid, thisCharacteristic);
	}

    if (device.capabilities["Power Meter"] !== undefined && thisService !== undefined) {	
        thisCharacteristic =  thisService.addCharacteristic(EnergyCharacteristics.CurrentConsumption)
        thisCharacteristic.on('get', function(callback) { callback(null, Math.round(that.device.attributes.power)); });
		that.platform.addAttributeUsage("power", this.deviceid, thisCharacteristic);
    }

    this.loadData(device, this);
}

function loadData(data, myObject) {
    var that = this;
    if (myObject !== undefined) that = myObject;
    if (data !== undefined) {
        this.device = data;
        for (var i = 0; i < that.services.length; i++) {
            for (var j = 0; j < that.services[i].characteristics.length; j++) {
                that.services[i].characteristics[j].getValue();
            }
        }
    } else {
        this.log.debug("Fetching Device Data")
        this.platform.api.getDevice(this.deviceid, function(data) {
            if (data === undefined) return;
            this.device = data;
            for (var i = 0; i < that.services.length; i++) {
                for (var j = 0; j < that.services[i].characteristics.length; j++) {
                    that.services[i].characteristics[j].getValue();
                }
            }
        });
    }
}

function getServices() {
    return this.services;
}
