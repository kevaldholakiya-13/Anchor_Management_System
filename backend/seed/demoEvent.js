/**
 * Demo Event Seed — InnovateFest 2026
 * Run: node seed/demoEvent.js
 *
 * Creates a realistic hackathon event with 5 sessions, 4 speakers,
 * and pre-seeds opening + closing scripts so the demo is immediately ready.
 */

require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EVENT_DATE = new Date('2026-09-19');

function ts(hour, minute = 0) {
  const d = new Date(EVENT_DATE);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding InnovateFest 2026...');

  // Clean up existing demo event
  const existing = await prisma.event.findFirst({ where: { name: 'InnovateFest 2026' } });
  if (existing) {
    await prisma.event.delete({ where: { id: existing.id } });
    console.log('   Removed existing demo event');
  }

  // Create the event
  const event = await prisma.event.create({
    data: {
      name: 'InnovateFest 2026',
      theme: 'Building the Future: AI, Systems & Human Impact',
      date: EVENT_DATE,
      venue: 'Gujarat Tech Hub, Ahmedabad — Auditorium A',
      status: 'LIVE',
    },
  });

  console.log(`   Event created: ${event.id}`);

  // Create speakers
  const speakers = await Promise.all([
    prisma.speaker.create({
      data: {
        eventId: event.id,
        name: 'Dr. Priya Menon',
        bio: 'Dr. Priya Menon is a Senior Research Scientist at Google DeepMind India, specializing in large language models and agentic AI systems. She completed her PhD from IIT Bombay and has published over 40 papers in top AI conferences including NeurIPS and ICML.',
        topic: 'Agentic AI: From Chatbots to Autonomous Systems',
        achievements: 'Named in Forbes 30 Under 30 Asia for Science & Healthcare; led the team behind Google\'s multilingual reasoning breakthroughs in 2025',
      },
    }),
    prisma.speaker.create({
      data: {
        eventId: event.id,
        name: 'Arjun Kapoor',
        bio: 'Arjun Kapoor is the co-founder and CTO of Stackwise, a Series B developer tooling startup building next-generation cloud infrastructure for AI workloads. Previously, he was a Principal Engineer at Cloudflare where he led edge compute architecture for Southeast Asia.',
        topic: 'Infrastructure at Scale: What No One Tells You',
        achievements: 'Built Stackwise from 0 to 200K developer users in 18 months; Y Combinator W24 alumni',
      },
    }),
    prisma.speaker.create({
      data: {
        eventId: event.id,
        name: 'Nisha Rawat',
        bio: 'Nisha Rawat is the founder of HealthThread, an AI-powered healthcare coordination platform operating across 6 Indian states. She was previously a product manager at Practo and holds an MBA from ISB Hyderabad.',
        topic: 'When Tech Meets Healthcare: Building for Impact, Not Just Scale',
        achievements: 'HealthThread reached 1 million patients in under 2 years; Nisha was invited to speak at WHO\'s Digital Health Summit in Geneva, 2025',
      },
    }),
    prisma.speaker.create({
      data: {
        eventId: event.id,
        name: 'Rohit Shah',
        bio: 'Rohit Shah is a Staff Engineer at Razorpay and one of India\'s most-followed open source contributors, with over 28K GitHub stars across his projects. He is passionate about making complex systems concepts accessible to students and early-career engineers.',
        topic: 'Open Source as a Career: Real Talk from the Trenches',
        achievements: 'Maintainer of 3 widely-used open source projects; mentored over 400 students through Google Summer of Code as an org admin',
      },
    }),
  ]);

  console.log(`   Speakers created: ${speakers.map((s) => s.name).join(', ')}`);

  // Create sessions (5 sessions)
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        eventId: event.id,
        order: 1,
        title: 'Opening Ceremony & Welcome Address',
        type: 'OPENING',
        speakerId: null,
        scheduledStart: ts(10, 0),
        scheduledEnd: ts(10, 30),
        status: 'COMPLETED',
        actualStart: ts(10, 0),
        actualEnd: ts(10, 28),
      },
    }),
    prisma.session.create({
      data: {
        eventId: event.id,
        order: 2,
        title: 'Agentic AI: From Chatbots to Autonomous Systems',
        type: 'KEYNOTE',
        speakerId: speakers[0].id,
        scheduledStart: ts(10, 30),
        scheduledEnd: ts(11, 30),
        status: 'IN_PROGRESS',
        actualStart: ts(10, 32),
        introScript:
          "Before I bring our first keynote speaker on stage, let me tell you a little about why we chose her to open InnovateFest. Dr. Priya Menon doesn't just study AI — she builds the systems that the rest of the field talks about. Named in Forbes 30 Under 30, she led breakthroughs in multilingual reasoning at DeepMind that have quietly powered tools millions of people use every day. Please welcome Dr. Priya Menon.",
      },
    }),
    prisma.session.create({
      data: {
        eventId: event.id,
        order: 3,
        title: 'Infrastructure at Scale: What No One Tells You',
        type: 'PANEL',
        speakerId: speakers[1].id,
        scheduledStart: ts(11, 40),
        scheduledEnd: ts(12, 30),
        status: 'PENDING',
        introScript:
          "You have heard the success stories. Now here is someone who will tell you what actually happens behind the scenes when you are growing at a pace nobody warned you about. Arjun Kapoor built Stackwise from zero to 200,000 developers in 18 months — and lived to tell the tale. Arjun, the stage is yours.",
        transitionScript:
          "Give it up one more time for Dr. Priya Menon — that was exactly the kind of deep-dive we needed to kickstart the day. Now we are shifting gears from the AI layer to what sits underneath it all: infrastructure. And trust me, you are going to want to hear this next one.",
      },
    }),
    prisma.session.create({
      data: {
        eventId: event.id,
        order: 4,
        title: 'When Tech Meets Healthcare: Building for Impact, Not Just Scale',
        type: 'KEYNOTE',
        speakerId: speakers[2].id,
        scheduledStart: ts(13, 30),
        scheduledEnd: ts(14, 15),
        status: 'PENDING',
        introScript:
          "Our next speaker built a platform that has touched one million patients across six Indian states — not as a vanity metric, but because lives genuinely depend on it working. Nisha Rawat was on stage at the WHO's Digital Health Summit last year, and today she is here with us. Nisha, welcome.",
        transitionScript:
          "Fascinating session from Arjun — if you are rethinking your architecture after that, you are not alone. After a quick lunch break, we are back with a session that will remind us why we build in the first place. See you at 1:30.",
      },
    }),
    prisma.session.create({
      data: {
        eventId: event.id,
        order: 5,
        title: 'Open Source as a Career: Real Talk from the Trenches',
        type: 'WORKSHOP',
        speakerId: speakers[3].id,
        scheduledStart: ts(14, 30),
        scheduledEnd: ts(15, 30),
        status: 'PENDING',
        introScript:
          "28,000 GitHub stars. 400 mentees through Google Summer of Code. And a very refreshingly honest take on what open source actually does for your career. Rohit Shah is a Staff Engineer at Razorpay by day and one of India's most impactful open source contributors by night. Rohit, take it away.",
        transitionScript:
          "Nisha Rawat, everyone — a reminder that the best products are built with empathy first, engineering second. We are nearly at the home stretch of InnovateFest 2026, and our final session is one you are going to want to take notes on.",
      },
    }),
  ]);

  console.log(`   Sessions created: ${sessions.length} sessions`);

  // Create EventMeta with pre-generated opening and closing scripts
  await prisma.eventMeta.upsert({
    where: { eventId: event.id },
    create: {
      eventId: event.id,
      openingScript:
        "Welcome, everyone, to InnovateFest 2026! If you have ever stayed up too late building something that might not work but felt like it absolutely had to — this day is for you. We are gathered here at Gujarat Tech Hub with some of the sharpest minds in AI, infrastructure, and health tech. Five sessions. Zero fluff. Pure signal. Let's make it a day you will actually remember. InnovateFest — let's go!",
      closingScript:
        "And that is a wrap on InnovateFest 2026! From Dr. Priya Menon's vision of agentic AI to Rohit Shah's unfiltered take on open source — every single session today gave us something real to take home. Thank you to our incredible speakers, to the organizing team who made this possible, and above all, to every one of you for showing up and staying curious. Go build something. We'll see you next year.",
    },
    update: {
      openingScript:
        "Welcome, everyone, to InnovateFest 2026! If you have ever stayed up too late building something that might not work but felt like it absolutely had to — this day is for you. We are gathered here at Gujarat Tech Hub with some of the sharpest minds in AI, infrastructure, and health tech. Five sessions. Zero fluff. Pure signal. Let's make it a day you will actually remember. InnovateFest — let's go!",
      closingScript:
        "And that is a wrap on InnovateFest 2026! From Dr. Priya Menon's vision of agentic AI to Rohit Shah's unfiltered take on open source — every single session today gave us something real to take home. Thank you to our incredible speakers, to the organizing team who made this possible, and above all, to every one of you for showing up and staying curious. Go build something. We'll see you next year.",
    },
  });

  console.log('   EventMeta (opening + closing scripts) seeded');
  console.log('');
  console.log('✅ Demo seed complete!');
  console.log(`   Event ID: ${event.id}`);
  console.log('   Copy this ID — you need it to open the live dashboard.');
  console.log('');
  console.log(`   Current state: Session 2 (Keynote by Dr. Priya Menon) is IN_PROGRESS`);
  console.log(`   Demo flow: trigger a delay on Session 2 to see the disruption handler fire.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
