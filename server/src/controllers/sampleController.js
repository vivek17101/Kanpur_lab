const Counter = require('../models/Counter');
const Sample = require('../models/Sample');

const REPORT_PREFIX = 'KL';

// Allowed top-level sample fields that may be updated via PUT.
// This whitelist prevents NoSQL injection via $set/$push/$unset in req.body.
const SAMPLE_UPDATE_FIELDS = [
  'sampleNo',
  'supplierName',
  'CO',
  'toMs',
  'sampleReference',
  'dateOfSeal',
  'dateReceived',
  'dateOfTest',
  'lorryNo',
  'bags',
  'weight',
  'conditionOfSample',
  'tests',
  'status',
];

function pickSampleFields(body) {
  const picked = {};
  for (const field of SAMPLE_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      picked[field] = body[field];
    }
  }
  return picked;
}

function getStatusFromTests(tests = [], fallback = 'Pending') {
  if (fallback === 'Reported') {
    return 'Reported';
  }

  return tests.some((test) => String(test.value || '').trim().length > 0) ? 'Tested' : 'Pending';
}

function getDateRangeFilter(startDate, endDate) {
  const range = {};

  if (startDate) {
    range.$gte = new Date(startDate);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }

  return Object.keys(range).length > 0 ? range : null;
}

function buildSampleFilter(query) {
  const { search = '', status = '', startDate = '', endDate = '' } = query;
  const filter = {};
  const dateRange = getDateRangeFilter(startDate, endDate);

  if (status) {
    filter.status = status;
  }

  if (dateRange) {
    filter.dateReceived = dateRange;
  }

  if (search) {
    filter.$or = [
      { reportNumber: { $regex: search, $options: 'i' } },
      { sampleNo: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
      { sampleReference: { $regex: search, $options: 'i' } },
      { CO: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
}

function getActivityForUpdate(update = {}) {
  if (update.status === 'Reported') {
    return { action: 'Report marked sent', detail: 'Sample status changed to Reported.' };
  }

  if (Array.isArray(update.tests)) {
    return { action: 'Test results saved', detail: `${update.tests.length} test rows updated.` };
  }

  return { action: 'Sample details updated', detail: 'Registration or report details changed.' };
}

async function getNextReportNumber(dateReceived) {
  const year = dateReceived ? new Date(dateReceived).getFullYear() : new Date().getFullYear();
  const key = `sample-report-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  const paddedSequence = String(counter.sequence).padStart(4, '0');

  return {
    reportNumber: `${REPORT_PREFIX}/${year}/${paddedSequence}`,
    reportYear: year,
    reportSequence: counter.sequence,
  };
}

exports.createSample = async (req, res, next) => {
  try {
    const reportMeta = await getNextReportNumber(req.body.dateReceived);
    // Pick only known fields to prevent operator injection
    const fields = pickSampleFields(req.body);

    const sample = await Sample.create({
      ...reportMeta,
      sampleNo: fields.sampleNo,
      supplierName: fields.supplierName,
      CO: fields.CO,
      toMs: fields.toMs,
      sampleReference: fields.sampleReference,
      dateOfSeal: fields.dateOfSeal || undefined,
      dateReceived: fields.dateReceived,
      dateOfTest: fields.dateOfTest || undefined,
      lorryNo: fields.lorryNo,
      bags: fields.bags,
      weight: fields.weight,
      conditionOfSample: fields.conditionOfSample,
      tests: Array.isArray(fields.tests) ? fields.tests : [],
      status: getStatusFromTests(
        Array.isArray(fields.tests) ? fields.tests : [],
        fields.status
      ),
      activityLog: [
        {
          action: 'Sample registered',
          detail: 'Sample entry created in the register.',
        },
      ],
    });

    res.status(201).json(sample);
  } catch (error) {
    next(error);
  }
};

exports.getSamples = async (req, res, next) => {
  try {
    const filter = buildSampleFilter(req.query);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [samples, total] = await Promise.all([
      Sample.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sample.countDocuments(filter),
    ]);

    res.json({
      samples,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSampleStats = async (req, res, next) => {
  try {
    const filter = buildSampleFilter({ ...req.query, status: '' });
    const [total, statusCounts] = await Promise.all([
      Sample.countDocuments(filter),
      Sample.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const stats = {
      total,
      Pending: 0,
      Tested: 0,
      Reported: 0,
    };

    statusCounts.forEach((item) => {
      stats[item._id] = item.count;
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

exports.getSampleById = async (req, res, next) => {
  try {
    const sample = await Sample.findById(req.params.id);

    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    res.json(sample);
  } catch (error) {
    next(error);
  }
};

exports.updateSample = async (req, res, next) => {
  try {
    // Whitelist fields — never spread req.body directly into a Mongoose update.
    // Doing so would allow callers to inject MongoDB operators ($set, $unset, $push, etc.).
    const safeUpdate = pickSampleFields(req.body);

    if (Array.isArray(safeUpdate.tests)) {
      safeUpdate.status = getStatusFromTests(safeUpdate.tests, safeUpdate.status);
    }

    const activityEntry = {
      ...getActivityForUpdate(safeUpdate),
      at: new Date(),
    };

    // Use $set for the field updates and $push for the activity log separately
    // so user-supplied data never touches the operator namespace.
    const mongoUpdate = {
      $set: safeUpdate,
      $push: { activityLog: activityEntry },
    };

    const sample = await Sample.findByIdAndUpdate(req.params.id, mongoUpdate, {
      new: true,
      runValidators: true,
    });

    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    res.json(sample);
  } catch (error) {
    next(error);
  }
};

exports.deleteSample = async (req, res, next) => {
  try {
    const sample = await Sample.findByIdAndDelete(req.params.id);

    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
