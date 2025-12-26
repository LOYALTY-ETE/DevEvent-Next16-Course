import { Schema, model, models, Document } from 'mongoose';

// Event document shape with strong typing
export interface EventDocument extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // normalized date string (ISO-like)
  time: string; // normalized time string (HH:MM)
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
  },
  {
    timestamps: true, // automatically manages createdAt and updatedAt
  },
);

// Helper to generate a URL-safe slug from the title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-|-$/g, ''); // trim leading/trailing dash
}

// Normalize date string to ISO-like format (YYYY-MM-DD)
function normalizeDate(dateInput: string): string {
  const parsed = new Date(dateInput);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid event date provided');
  }

  // Store just the date portion for consistency
  return parsed.toISOString().split('T')[0];
}

// Normalize time string to HH:MM (24-hour) format
function normalizeTime(timeInput: string): string {
  const trimmed = timeInput.trim();

  // Accept basic HH:MM or H:MM with optional leading zero
  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!timeMatch) {
    throw new Error('Time must be in HH:MM format');
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Time must be a valid 24-hour time');
  }

  const normalizedHours = hours.toString().padStart(2, '0');
  const normalizedMinutes = minutes.toString().padStart(2, '0');

  return `${normalizedHours}:${normalizedMinutes}`;
}

// Pre-save hook: generate slug, validate/normalize date and time, enforce required fields
EventSchema.pre<EventDocument>('save', function preSave(next) {
  // Basic runtime validation for required string fields beyond Mongoose's own checks
  const requiredStringFields: Array<keyof EventDocument> = [
    'title',
    'description',
    'overview',
    'image',
    'venue',
    'location',
    'date',
    'time',
    'mode',
    'audience',
    'organizer',
  ];

  for (const field of requiredStringFields) {
    const value = this[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      return next(new Error(`Field "${String(field)}" is required and cannot be empty`));
    }
  }

  // Ensure agenda and tags are non-empty arrays
  if (!Array.isArray(this.agenda) || this.agenda.length === 0) {
    return next(new Error('Field "agenda" is required and must contain at least one item'));
  }

  if (!Array.isArray(this.tags) || this.tags.length === 0) {
    return next(new Error('Field "tags" is required and must contain at least one item'));
  }

  // Only regenerate slug if the title was modified
  if (this.isModified('title')) {
    this.slug = generateSlug(this.title);
  }

  try {
    // Normalize date and time into consistent formats before persisting
    this.date = normalizeDate(this.date);
    this.time = normalizeTime(this.time);
  } catch (error) {
    return next(error as Error);
  }

  return next();
});

// Explicit unique index on slug for fast lookups and uniqueness enforcement
EventSchema.index({ slug: 1 }, { unique: true });

export const Event = models.Event || model<EventDocument>('Event', EventSchema);
