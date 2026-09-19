import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Mail, MessageCircle, Phone } from 'lucide-react'

export function ContactSection() {
  const [sent, setSent] = useState(false)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSent(true) }
  return (
    <section className="contact-section" id="contact">
      <div className="contact-intro"><span className="eyebrow">Start a conversation</span><h2>Let's work<br /><em>together.</em></h2><p>Tell us what you are building, changing, or figuring out, and we will come back with a thoughtful next step.</p><p className="contact-placeholder-note">Contact details are placeholders until the official BizzBuddy Consulting inbox and phone are configured.</p><div className="contact-links"><span><Mail size={18} /> Email placeholder</span><span><MessageCircle size={18} /> WhatsApp placeholder</span><span><Phone size={18} /> Phone placeholder</span></div></div>
      <form className="contact-form" onSubmit={handleSubmit}>{sent ? <div className="form-success"><span><Check size={20} /></span><h3>Message received.</h3><p>This placeholder form is ready to connect to the BizzBuddy Consulting inbox.</p><button type="button" className="text-link" onClick={() => setSent(false)}>Send another <ArrowUpRight size={15} /></button></div> : <><div className="form-row"><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required type="email" name="email" placeholder="you@company.com" /></label></div><label>What can we make better?<textarea required name="message" rows={5} placeholder="A little context goes a long way..." /></label><button className="button button--lime" type="submit">Send inquiry <ArrowUpRight size={17} /></button></>}</form>
    </section>
  )
}
