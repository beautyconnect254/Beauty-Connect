insert into public.skills (id, name, role)
values
  ('skill-color-correction', 'Color Correction', 'Hair Stylist'),
  ('skill-silk-press', 'Silk Press', 'Hair Stylist'),
  ('skill-fades', 'Skin Fades', 'Barber'),
  ('skill-beards', 'Beard Sculpting', 'Barber'),
  ('skill-gel-x', 'Gel-X Extensions', 'Nail Technician'),
  ('skill-nail-art', 'Luxury Nail Art', 'Nail Technician'),
  ('skill-bridal-makeup', 'Bridal Makeup', 'Makeup Artist'),
  ('skill-editorial', 'Editorial Looks', 'Makeup Artist'),
  ('skill-aromatherapy', 'Aromatherapy', 'Spa Therapist'),
  ('skill-knotless', 'Knotless Braids', 'Braider')
on conflict (id) do nothing;

insert into public.workers (
  id,
  full_name,
  primary_role,
  profile_photo,
  location,
  years_of_experience,
  bio,
  availability_status,
  verification_status,
  salary_expectation,
  work_type,
  whatsapp_number,
  headline,
  featured,
  listed_publicly
)
values
  (
    'amara-njeri',
    'Amara Njeri',
    'Hair Stylist',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    'Nairobi',
    8,
    'Luxury color specialist with strong floor polish and repeat-booking habits.',
    'reserved',
    'verified',
    90000,
    'full-time',
    '+254 700 111 221',
    'Reserved for a Nairobi expansion team after trial success.',
    true,
    true
  ),
  (
    'baraka-otieno',
    'Baraka Otieno',
    'Barber',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    'Nairobi',
    6,
    'High-floor barber with strong fade accuracy and fast membership chair turnover.',
    'reserved',
    'verified',
    70000,
    'contract',
    '+254 701 443 008',
    'Held for an urgent grooming club request.',
    true,
    true
  ),
  (
    'nadia-aziz',
    'Nadia Aziz',
    'Nail Technician',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    'Nairobi',
    8,
    'Luxury nail technician with high sanitation discipline and premium set presentation.',
    'reserved',
    'verified',
    72000,
    'full-time',
    '+254 713 990 144',
    'Reserved for launch-week manicure coverage.',
    false,
    true
  ),
  (
    'aisha-noor',
    'Aisha Noor',
    'Lash Technician',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653c1?auto=format&fit=crop&w=900&q=80',
    'Nairobi',
    4,
    'Growth-stage lash artist in onboarding while final documents clear.',
    'available',
    'pending',
    60000,
    'part-time',
    '+254 711 188 320',
    'Pending verification.',
    false,
    false
  ),
  (
    'imaan-abdi',
    'Imaan Abdi',
    'Braider',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    'Mombasa',
    10,
    'High-capacity braider suited for destination and seasonal demand spikes.',
    'available',
    'verified',
    82000,
    'contract',
    '+254 734 508 199',
    'Verified and available for protective style demand.',
    false,
    true
  )
on conflict (id) do nothing;

insert into public.worker_references (
  id,
  worker_id,
  contact_name,
  contact_phone,
  relationship,
  previous_workplace
)
values
  ('ref-1', 'amara-njeri', 'Janet Wambui', '+254 721 111 902', 'Former salon manager', 'Oak and Ember Salon'),
  ('ref-2', 'baraka-otieno', 'Victor Kariuki', '+254 703 224 908', 'Shop owner', 'Crown Grooming Club'),
  ('ref-3', 'nadia-aziz', 'Farida Yusuf', '+254 705 987 661', 'Studio manager', 'Lustre Nail Atelier'),
  ('ref-4', 'aisha-noor', 'Fauzia Ahmed', '+254 714 992 334', 'Beauty bar owner', 'The Lash Room'),
  ('ref-5', 'imaan-abdi', 'Nasra Said', '+254 701 882 120', 'Salon supervisor', 'Coast Texture Studio')
on conflict (id) do nothing;

insert into public.worker_skills (id, worker_id, skill_id, proficiency_level)
values
  ('ws-1', 'amara-njeri', 'skill-color-correction', 'specialist'),
  ('ws-2', 'amara-njeri', 'skill-silk-press', 'advanced'),
  ('ws-3', 'baraka-otieno', 'skill-fades', 'specialist'),
  ('ws-4', 'baraka-otieno', 'skill-beards', 'advanced'),
  ('ws-5', 'nadia-aziz', 'skill-gel-x', 'advanced'),
  ('ws-6', 'nadia-aziz', 'skill-nail-art', 'specialist'),
  ('ws-7', 'aisha-noor', 'skill-classic-lash', 'advanced'),
  ('ws-8', 'imaan-abdi', 'skill-knotless', 'specialist')
on conflict (id) do nothing;

insert into public.portfolio_images (id, worker_id, image_url, caption, is_cover)
values
  (
    'pi-1',
    'amara-njeri',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    'Dimensional blonde refresh',
    true
  ),
  (
    'pi-2',
    'baraka-otieno',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80',
    'Low fade and beard refinement',
    true
  ),
  (
    'pi-3',
    'nadia-aziz',
    'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80',
    'Luxury manicure set',
    true
  )
on conflict (id) do nothing;

insert into public.team_requests (
  id,
  salon_name,
  contact_name,
  contact_email,
  contact_whatsapp,
  location,
  verified_only,
  work_type,
  urgency,
  status,
  notes,
  target_start_date,
  submitted_at
)
values
  (
    'req-luna-house',
    'Luna House Salon',
    'Martha Wainaina',
    'martha@lunahouse.example',
    '+254 745 111 777',
    'Nairobi',
    true,
    'full-time',
    'priority',
    'staffing',
    'Second branch launch with premium floor expectations and immediate opening-week needs.',
    '2026-05-28',
    '2026-05-03T09:15:00.000Z'
  ),
  (
    'req-baroque-grooming',
    'Baroque Grooming Club',
    'Kevin Maina',
    'kevin@baroque.example',
    '+254 709 880 191',
    'Nairobi',
    true,
    'contract',
    'urgent',
    'reviewing',
    'Needs barbers for premium membership traffic and faster chair turnaround.',
    '2026-06-05',
    '2026-05-07T14:05:00.000Z'
  ),
  (
    'req-coastline-beauty',
    'Coastline Beauty Lounge',
    'Amina Salim',
    'amina@coastline.example',
    '+254 731 144 822',
    'Mombasa',
    true,
    'freelance',
    'priority',
    'new',
    'Peak tourism season support for protective styling and bridal demand.',
    '2026-05-20',
    '2026-05-01T12:00:00.000Z'
  )
on conflict (id) do nothing;

insert into public.team_request_roles (
  id,
  team_request_id,
  role,
  quantity,
  min_experience
)
values
  ('trr-luna-hair', 'req-luna-house', 'Hair Stylist', 2, 4),
  ('trr-luna-nails', 'req-luna-house', 'Nail Technician', 1, 3),
  ('trr-baroque-barber', 'req-baroque-grooming', 'Barber', 2, 5),
  ('trr-coastline-braider', 'req-coastline-beauty', 'Braider', 2, 4)
on conflict (id) do nothing;

insert into public.team_request_role_specialties (id, team_request_role_id, skill_id)
values
  ('trrs-1', 'trr-luna-hair', 'skill-color-correction'),
  ('trrs-2', 'trr-luna-hair', 'skill-silk-press'),
  ('trrs-3', 'trr-luna-nails', 'skill-gel-x'),
  ('trrs-4', 'trr-luna-nails', 'skill-nail-art'),
  ('trrs-5', 'trr-baroque-barber', 'skill-fades'),
  ('trrs-6', 'trr-baroque-barber', 'skill-beards'),
  ('trrs-7', 'trr-coastline-braider', 'skill-knotless')
on conflict (id) do nothing;

insert into public.verification_documents (
  id,
  worker_id,
  document_type,
  status,
  file_url,
  uploaded_at
)
values
  (
    'doc-1',
    'amara-njeri',
    'National ID',
    'verified',
    'https://storage.example.com/amara-id.pdf',
    '2026-04-29T10:00:00.000Z'
  ),
  (
    'doc-2',
    'baraka-otieno',
    'National ID',
    'verified',
    'https://storage.example.com/baraka-id.pdf',
    '2026-04-25T08:00:00.000Z'
  ),
  (
    'doc-3',
    'aisha-noor',
    'National ID',
    'pending',
    'https://storage.example.com/aisha-id.pdf',
    '2026-05-06T10:00:00.000Z'
  )
on conflict (id) do nothing;

insert into public.staffing_assignments (
  id,
  team_request_id,
  team_request_role_id,
  worker_id,
  status,
  assigned_by,
  assigned_at,
  notes
)
values
  (
    'assign-luna-amara',
    'req-luna-house',
    'trr-luna-hair',
    'amara-njeri',
    'reserved',
    'Grace',
    '2026-05-05T11:00:00.000Z',
    'Reserved after successful demo and client approval.'
  ),
  (
    'assign-luna-nadia',
    'req-luna-house',
    'trr-luna-nails',
    'nadia-aziz',
    'reserved',
    'Grace',
    '2026-05-06T09:00:00.000Z',
    'Reserved for opening-week manicure coverage.'
  ),
  (
    'assign-baroque-baraka',
    'req-baroque-grooming',
    'trr-baroque-barber',
    'baraka-otieno',
    'reserved',
    'Kevin',
    '2026-05-07T16:00:00.000Z',
    'Client requested a temporary hold while final slot is reviewed.'
  )
on conflict (id) do nothing;

insert into public.admin_notes (
  id,
  worker_id,
  team_request_id,
  staffing_assignment_id,
  author,
  note,
  created_at
)
values
  (
    'note-1',
    'aisha-noor',
    null,
    null,
    'Grace',
    'Waiting on updated government ID before verification can be completed.',
    '2026-05-06T10:20:00.000Z'
  ),
  (
    'note-2',
    null,
    'req-luna-house',
    null,
    'Kevin',
    'Owner is open to staggering the second stylist by one week if the first hires are strong.',
    '2026-05-05T13:45:00.000Z'
  ),
  (
    'note-3',
    null,
    null,
    'assign-luna-amara',
    'Grace',
    'Reservation confirmed after compensation band aligned.',
    '2026-05-05T11:15:00.000Z'
  )
on conflict (id) do nothing;
