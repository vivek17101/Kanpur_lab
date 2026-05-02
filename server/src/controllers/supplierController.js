const Supplier = require('../models/Supplier');

exports.getSuppliers = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
    const suppliers = await Supplier.find(filter).sort({ name: 1 });

    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({
      name: req.body.name,
      whatsappNumber: req.body.whatsappNumber,
      contactPerson: req.body.contactPerson,
      address: req.body.address,
    });

    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        whatsappNumber: req.body.whatsappNumber,
        contactPerson: req.body.contactPerson,
        address: req.body.address,
      },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
