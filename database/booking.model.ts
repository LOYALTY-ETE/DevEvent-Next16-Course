import { Schema, model, models, Document, Types } from 'mongoose';
import { Event } from './event.model';

// Booking document shape with strong typing
export interface BookingDocument extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // index for faster queries by event
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // automatically manages createdAt and updatedAt
  },
);

// Basic but practical email validation pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pre-save hook: validate email format and ensure referenced event exists
BookingSchema.pre<BookingDocument>('save', async function preSave(next) {
  if (typeof this.email !== 'string' || this.email.trim().length === 0) {
    return next(new Error('Email is required'));
  }

  if (!EMAIL_REGEX.test(this.email)) {
    return next(new Error('Email must be a valid email address'));
  }

  // Verify that the associated event exists before creating a booking
  try {
    const eventExists = await Event.exists({ _id: this.eventId });

    if (!eventExists) {
      return next(new Error('Cannot create booking: referenced event does not exist'));
    }
  } catch (error) {
    return next(error as Error);
  }

  return next();
});

export const Booking = models.Booking || model<BookingDocument>('Booking', BookingSchema);
