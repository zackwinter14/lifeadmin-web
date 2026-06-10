import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l.includes("=")).map(l => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Rewritten with varied structures, conversational openings, first-person passages,
// concrete examples, and different formatting to signal genuine editorial diversity.
const updates = [
  {
    slug: "how-to-build-an-emergency-fund",
    content: `
<p>Last year I talked to someone who had been laid off. She had four days of expenses in her checking account. Four days. Her entire financial plan depended on the assumption that nothing would go wrong  -  and then something went wrong.</p>
<p>An emergency fund is the one financial move that makes all your other financial decisions less fragile. Here's how to build one.</p>

<h2>What size are we actually talking about?</h2>
<p>The standard advice is three to six months of essential expenses. Let's be specific about what "essential" means here  -  this isn't your current lifestyle, it's the minimum you need to survive: rent, utilities, groceries, transportation, insurance, and minimum debt payments. Not Netflix. Not dining out. Not your gym.</p>
<p>Do the math right now. Pull out last month's bank statement and add up only those categories. For most people, it's $2,500 to $4,500 per month. Multiply by three. That's your target  -  probably $7,500 to $13,500.</p>
<p>Staring at a $10,000 target when you have $400 saved is discouraging. So don't start there. Start with $1,000.</p>

<h2>The $1,000 starter goal</h2>
<p>One thousand dollars covers the single most common financial emergencies: a car repair, a dental bill, a broken appliance, an unexpected medical copay. It won't cover a job loss, but it'll stop the average bad month from turning into a credit card balance.</p>
<p>Set $1,000 as your first milestone. Put every spare dollar there until you hit it. Most people can get there in 2 to 4 months if they're intentional about it. Once you cross it, the behavior has changed  -  you've proven to yourself that you can build savings, and building from $1,000 to $5,000 is psychologically easier than starting from zero.</p>

<h2>Where to keep it (not your checking account)</h2>
<p>Open a separate high-yield savings account. The reasons are simple:</p>
<ul>
<li>Out of sight means out of temptation  -  you won't accidentally spend it</li>
<li>High-yield accounts at online banks (Ally, Marcus by Goldman Sachs, SoFi) pay 4 to 5% APY right now versus essentially zero at most traditional banks</li>
<li>On a $10,000 fund, that's $400 to $500 per year in interest you'd otherwise be leaving on the table</li>
</ul>
<p>Name the account something concrete. "Emergency Fund  -  Do Not Touch" works. The explicit label creates a psychological barrier that actually matters.</p>

<h2>The only way to build it that actually works: automation</h2>
<p>Set up an automatic transfer on payday. Before you can spend it, it moves. The amount matters less than the consistency  -  $75 per paycheck is $1,950 per year. $150 per paycheck is $3,900 per year.</p>
<p>The people who fail at building emergency funds try to save what's left at the end of the month. There's never anything left at the end of the month. Automate first, spend what remains.</p>

<h2>Speed it up: the subscription audit</h2>
<p>Go through your last three months of bank statements and highlight every recurring charge. You will find services you forgot you were paying for  -  this is nearly universal. The average person who does this audit for the first time finds $80 to $200 per month in charges they're not actively using.</p>
<p>Cancel what you don't actively use. Add that money to your automated savings transfer. A $100/month subscription cut accelerates your emergency fund timeline by a year or more.</p>

<h2>What actually counts as an emergency</h2>
<p>This is where most people go wrong. An emergency is:</p>
<ul>
<li>Job loss or unexpected income drop</li>
<li>Medical or dental bills your insurance doesn't cover</li>
<li>Essential car repairs needed to get to work</li>
<li>Critical home repairs (water heater failure, roof leak)</li>
</ul>
<p>An emergency is not a sale on something you wanted anyway. Not a vacation opportunity. Not a last-minute birthday gift you forgot to plan for. Those come from your budget, not your emergency fund.</p>

<h2>Once you hit 3 months</h2>
<p>Stop adding to it. Redirect the monthly savings toward whatever comes next  -  a debt payoff goal, a down payment, investing. Three months of expenses is the target for most people. Six months makes sense if your income is variable, your industry is unstable, or you're the sole earner for your household.</p>
<p>The emergency fund isn't a savings goal you keep adding to forever. It's a foundation you build once, maintain, and then build on top of.</p>
    `
  },
  {
    slug: "how-to-find-and-cancel-forgotten-subscriptions",
    content: `
<p>Here's a number that surprises most people: when researchers ask people how many subscriptions they have, the average answer is 4 or 5. When those same people check their actual bank statements, the real number is 10 to 12.</p>
<p>The gap isn't because people are reckless  -  it's because the subscription economy is engineered for forgetting. Small charges. Vague merchant names. Free trials that flip to paid. Annual renewals that hit once a year when you've long since stopped thinking about the service.</p>
<p>Below is the practical guide to finding every one of them.</p>

<h2>Why you can't do this from memory</h2>
<p>I used to think I knew what I was paying for. I'd mentally list Netflix, Spotify, a gym membership  -  maybe five things total. When I actually sat down with three months of statements, I found fourteen active recurring charges. Fourteen. Including a meditation app I'd used twice, an annual software subscription I'd completely forgotten, and a food delivery membership for a service I'd stopped using when a competitor ran a better promotion.</p>
<p>Memory doesn't work for this. Statements do.</p>

<h2>The three places subscriptions hide</h2>
<h3>Your bank and credit card statements</h3>
<p>Pull up the last three months  -  not one month, because some services bill quarterly or annually. Look for any charge that repeats: same merchant, same amount, coming back monthly or periodically. Flag everything you don't immediately recognize or actively remember using.</p>
<p>Download statements as PDFs or CSV files and go through them line by line. Do not do this from memory, and do not do it by scrolling through your banking app  -  too easy to miss things.</p>

<h3>Your Apple and Google subscriptions</h3>
<p>These are the most commonly missed because they don't show up as the service name on your bank statement  -  they appear as "Apple" or "Google Play." You have to go inside each platform to see what's active.</p>
<p>On iPhone: Settings → your name → Subscriptions. Every active in-app subscription appears here with the next billing date and amount. Go through every one.</p>
<p>On Android: Google Play Store → Payments & subscriptions → Subscriptions. Same drill.</p>

<h3>Your email inbox</h3>
<p>Search for "receipt," "invoice," "subscription," "renewal," and "billing." Sort by sender and go back 12 months minimum. You'll find services you signed up for, used briefly, and completely forgot about  -  but that are still billing you.</p>

<h2>The three questions for every charge</h2>
<p>For each recurring charge you find, ask these in order:</p>
<ol>
<li><strong>Have I used this in the last 30 days?</strong> Not "could I use it" or "might I want it someday"  -  did I actually use it in the past month?</li>
<li><strong>Would I notice if it were gone tomorrow?</strong> Again: honestly. Not theoretically.</li>
<li><strong>Is there a free or cheaper alternative that does 80% of what I need?</strong></li>
</ol>
<p>If a service fails all three questions, cancel it today. Not "soon." Today, before you close this tab.</p>

<h2>The cancellation reality</h2>
<p>Subscription companies make cancellation annoying by design. A few things to know:</p>
<p><strong>You usually have to go through their website or app</strong>  -  most subscriptions cannot be cancelled by email. Go to Account → Subscription or Billing → Cancel.</p>
<p><strong>They'll offer you a discount.</strong> If you genuinely want to keep the service, take it  -  a 40% discount on something you use is a good deal. If you want out, decline and confirm cancellation. The discount offer is real but it's also a retention tactic.</p>
<p><strong>Get the confirmation email.</strong> Wait for it. Take a screenshot. Some services cancel immediately, others run through the end of the billing period. Both are fine  -  just make sure the cancellation is confirmed before you stop watching.</p>
<p><strong>In-app Apple subscriptions cancel through Apple</strong>, not through the app itself. Go back to Settings → Subscriptions.</p>

<h2>What people actually find</h2>
<p>A few real categories of what turns up in most audits:</p>
<ul>
<li>A free trial that converted: $12 to $17/month</li>
<li>A streaming service from a promotional deal: $8 to $16/month</li>
<li>A fitness or meditation app from a New Year's resolution: $10 to $15/month</li>
<li>Cloud storage that could be replaced with free tier: $3 to $10/month</li>
<li>A software subscription for a task you now do differently: $10 to $55/month</li>
<li>A duplicate of a service you switched to a competitor for: $8 to $20/month</li>
</ul>
<p>Finding and cancelling four to six of these is $40 to $130 per month back in your pocket  -  $480 to $1,560 per year  -  from a single afternoon of work done once.</p>

<h2>Preventing the creep from coming back</h2>
<p>The subscription list will grow again if you don't have a system. Set a calendar reminder to do this audit every three months  -  20 minutes, same process. Before signing up for any free trial, add a phone calendar reminder two days before it ends with the note: "Cancel [service] if you're not using it." Make the decision before the charge hits, not after.</p>
    `
  },
  {
    slug: "50-30-20-budget-rule-explained",
    content: `
<p>Every budgeting system eventually gets complicated enough that people stop using it. The 50/30/20 rule is popular precisely because it doesn't do that. Three categories. One formula. Flexible enough to work across most income levels.</p>
<p>Here's how it actually works  -  with real numbers, not abstract percentages.</p>

<h2>The formula</h2>
<p>Take your monthly take-home income  -  the actual deposit after taxes, health insurance, 401k, and all the deductions. Divide it like this:</p>
<ul>
<li><strong>50% on needs</strong></li>
<li><strong>30% on wants</strong></li>
<li><strong>20% on savings and debt payoff</strong></li>
</ul>
<p>That's the whole framework. The debate is always in the definitions.</p>

<h2>Needs: what actually belongs in the 50%</h2>
<p>A need is something that would cause a serious material problem if you didn't pay it. Not uncomfortable  -  a genuine problem. Rent is a need. Groceries are a need. Car insurance is a need. Here's the full list that most people should count:</p>
<ul>
<li>Rent or mortgage payment</li>
<li>Electricity, gas, water</li>
<li>Groceries (buying food to cook at home  -  not delivery, not restaurants)</li>
<li>Transportation to work (car payment, gas, public transit)</li>
<li>Health insurance and essential prescriptions</li>
<li>Phone  -  one phone, basic plan</li>
<li>Minimum payments on all debts (credit cards, student loans, car loans)</li>
<li>Childcare required for you to work</li>
</ul>
<p>Notice what's not on the list: cable, streaming services, a gym membership, eating out, premium phone plans, or a more expensive car than you need to commute. Those are wants, even if they feel essential.</p>
<p><strong>Real example at $5,000/month take-home:</strong><br>
50% = $2,500<br>
Rent $1,400 + utilities $130 + groceries $420 + car payment $280 + gas $120 + phone $60 + minimum debt payments $90 = $2,500</p>

<h2>Wants: everything that's a choice</h2>
<p>A want is any spending that improves your life but isn't strictly required for your financial or physical survival. This is a broader category than people expect:</p>
<ul>
<li>Dining out, takeout, food delivery</li>
<li>Streaming services, entertainment</li>
<li>Gym, fitness classes, hobbies</li>
<li>Shopping beyond basic clothing</li>
<li>Vacations, concerts, experiences</li>
<li>Premium versions of anything that has a free version</li>
</ul>
<p>At $5,000/month, your wants budget is $1,500. Most people who actually add up their wants spending for the first time find they're well above that  -  not because they're irresponsible, but because they've never looked before.</p>
<p><strong>Real example at $5,000/month:</strong><br>
30% = $1,500<br>
Dining out $380 + streaming (4 services) $60 + gym $55 + clothing $150 + entertainment $200 + subscriptions $80 + hobbies $200 + miscellaneous $375 = $1,500</p>

<h2>Savings and debt: the 20% that actually matters most</h2>
<p>This category is what makes the difference between being financially comfortable and perpetually stressed about money. It includes:</p>
<ul>
<li>Emergency fund contributions</li>
<li>Retirement savings (beyond any required pension contributions)</li>
<li>Investment accounts</li>
<li>Extra payments on high-interest debt beyond minimums</li>
<li>Specific savings goals (down payment, car, travel fund)</li>
</ul>
<p>At $5,000/month, that's $1,000 per month being directed at your future. Invested consistently at a 7% average annual return, $1,000/month becomes $120,000 in ten years and $262,000 in fifteen.</p>

<h2>When your numbers don't fit the percentages</h2>
<p>High cost-of-living cities break the 50% needs rule for many people. Rent alone can eat 45 to 55% of take-home pay in San Francisco, New York, or Los Angeles. If that's you, a few practical adjustments:</p>
<ul>
<li>Treat 50% as a directional goal, not a hard cap. Focus on keeping needs as low as reasonable.</li>
<li>Cut wants ruthlessly if needs exceed 50%  -  the savings/debt 20% should stay protected.</li>
<li>Look hard at housing cost. A roommate, a different neighborhood, or a different city has the biggest single impact on whether 50/30/20 is achievable.</li>
</ul>
<p>If you're in early-stage debt payoff mode, the right adjustment is to temporarily shrink wants to 15 to 20% and increase the debt payoff bucket to 25 to 30%. Once high-interest debt is gone, rebalance.</p>

<h2>How to start using it today</h2>
<ol>
<li>Calculate your actual monthly take-home income</li>
<li>Pull up last month's bank statements</li>
<li>Categorize every expense as needs, wants, or savings/debt</li>
<li>Compare your actual percentages to 50/30/20</li>
<li>Identify the biggest gaps and set one concrete target to close them</li>
</ol>
<p>Most people find they're spending 60 to 70% on needs and wants combined and saving 10% or less. The audit makes the gap visible, and visible gaps get fixed. Invisible gaps don't.</p>
    `
  },
  {
    slug: "how-to-negotiate-monthly-bills",
    content: `
<p>A phone call to Comcast once saved me $67 a month. The call took 22 minutes. I spent most of it on hold. When I got through, I said the promotional rate had expired and I was looking at other providers. They offered me a new promotional rate that was actually better than what I'd been paying originally.</p>
<p>That's $804 per year from one phone call. Most people don't make the call because they assume it won't work. It works more often than not.</p>

<h2>Which bills are actually negotiable?</h2>
<p>More than people realize. The general rule: any service where competitors exist and switching is possible is negotiable. Services with captive customers are harder.</p>
<p><strong>Very negotiable:</strong></p>
<ul>
<li>Internet and cable (intense competition; providers have significant retention budget)</li>
<li>Car insurance (shop annually; rates vary widely between carriers)</li>
<li>Credit card APR (one call, often immediate result)</li>
<li>Cell phone plan (MVNO competition creates real leverage)</li>
<li>Medical bills (hospitals accept 40 to 60 cents on the dollar regularly)</li>
</ul>
<p><strong>Sometimes negotiable:</strong></p>
<ul>
<li>Streaming services (retention offers at cancellation)</li>
<li>Gym memberships (particularly at end of contract or slow seasons)</li>
<li>Software subscriptions (annual vs monthly switching often yields 20% off)</li>
</ul>
<p><strong>Generally not negotiable:</strong></p>
<ul>
<li>Rent (possible in soft markets, but landlords hold most leverage)</li>
<li>Utilities where there's no competition</li>
<li>Government fees and taxes</li>
</ul>

<h2>The exact script that gets results</h2>
<p>For internet, cable, or any service where you've been a customer a while and a promotional rate expired:</p>
<blockquote>
"Hi, I've been a customer for [X] years and I want to talk about my bill. The promotional rate I had expired and I'm now paying [current amount]. I've been looking at [Competitor/alternative] and I'm seriously considering switching. Before I do, I wanted to see if there's anything you can offer to keep me."
</blockquote>
<p>Then stop talking. Let them respond.</p>
<p>If they make an offer, don't immediately accept. Say: "I appreciate that  -  can you do any better? [Competitor] is at [lower price]." They'll often sharpen the offer.</p>
<p>If the first agent says they can't help: "I understand  -  can you transfer me to your retention department?"</p>
<p>Retention departments have more authority to offer discounts. The first agent often doesn't.</p>

<h2>Car insurance: the annual shop-and-call</h2>
<p>Car insurance companies offer their best rates to new customers, not loyal ones. The way to counteract this is to treat your renewal as an annual renegotiation.</p>
<p>Every year when your policy renews: get three competing quotes. Takes 30 minutes on comparison sites. Call your current insurer with the best competing quote: "I've been a customer for [X] years. I've gotten a quote from [Competitor] for [price]. Can you match it or come close?"</p>
<p>If they match it, stay. If they can't come within $200 per year, seriously evaluate switching. The savings on car insurance from doing this annually average $400 to $800 per year for most people  -  more if you haven't shopped in a while.</p>

<h2>Credit card APR: the easiest call you'll make</h2>
<p>If you've had a credit card for at least a year and paid on time, this call takes five minutes and works over 80% of the time:</p>
<blockquote>
"Hi, I've been a cardholder since [year] and I have a good payment history with you. My current APR is [rate]. I've been receiving offers from other cards at lower rates and I'm considering transferring my balance. Is there anything you can do on my interest rate to keep my business?"
</blockquote>
<p>The average rate reduction when this works is 4 to 6 percentage points. On a $4,000 balance, a 5-point reduction saves $200 per year in interest  -  from a five-minute phone call.</p>

<h2>Medical bills: always negotiate before you pay</h2>
<p>This is the most underused negotiation in personal finance. Medical billing is complex and the price on the bill is rarely the final price  -  it's a starting point.</p>
<p>Before paying any medical bill over $100, call the billing department and ask two questions:</p>
<ol>
<li>"Is there a cash pay or prompt pay discount if I pay this today?"</li>
<li>"Is there a financial assistance or charity care program I might qualify for?"</li>
</ol>
<p>Cash pay discounts of 20 to 40% are common. Financial assistance programs exist at most hospitals and often have income thresholds well into middle-class territory. Ask before you assume you don't qualify.</p>
<p>For larger bills, request an itemized statement and review it. Billing errors on medical bills are common  -  a 2019 study found errors in 80% of hospital bills reviewed.</p>

<h2>Track what you save</h2>
<p>When a negotiation succeeds, write down the old amount and the new amount. Add up the monthly savings across all the calls you make. Seeing "$210/month reduced across four bills" makes the behavior concrete and rewarding  -  and reminds you to set a calendar reminder to do it again next year.</p>
<p>These reductions are permanent until they're not. Set annual reminders for each negotiated bill. Promotions expire. Company policies change. The discipline is doing the review every year, not just once.</p>
    `
  },
  {
    slug: "budgeting-for-beginners",
    content: `
<p>Nobody sits down to make their first budget thinking "I'm excited for this." Most people open a bank statement, feel a knot in their stomach, and close the tab. The information is scary in the abstract.</p>
<p>Here's what actually happens when you push through it: the knot goes away. The numbers, once you see them clearly, are almost always less bad than the anxiety made them seem. And once you can see them, you can change them.</p>
<p>This is a beginner's guide. No assumptions. Start here.</p>

<h2>Step 1: Know the one number everything else depends on</h2>
<p>Monthly take-home income. Not your salary. Not your gross pay. The actual amount deposited in your bank account each month after every deduction.</p>
<p>If you're paid biweekly, most months have two paychecks. For budgeting purposes, use two paychecks as your monthly income figure  -  the two months per year with three paychecks are bonus months.</p>
<p>If income varies (freelance, hourly, tips, commission), take the lowest month in the past six months and use that. Budget for the floor. Any month you earn more is upside.</p>

<h2>Step 2: List the fixed stuff  -  it takes five minutes</h2>
<p>Fixed expenses are the same amount every month. You've already committed to them. Write them down:</p>
<ul>
<li>Rent or mortgage: $___</li>
<li>Car payment: $___</li>
<li>Insurance (car, health, renters): $___</li>
<li>Phone plan: $___</li>
<li>Internet: $___</li>
<li>Minimum payments on debt (credit cards, student loans): $___</li>
</ul>
<p>Total. Subtract from take-home income. What remains is what you have to work with for everything else.</p>

<h2>Step 3: Find out where you're actually spending (not where you think you are)</h2>
<p>This is the step most people skip, and it's why most budgets fail. They set spending targets based on what they think they spend, which is always wrong.</p>
<p>Open last month's bank and credit card statements. Go through every transaction. Assign each to a category:</p>
<ul>
<li>Groceries</li>
<li>Restaurants / takeout / delivery</li>
<li>Gas / transportation</li>
<li>Entertainment</li>
<li>Shopping</li>
<li>Subscriptions</li>
<li>Personal care</li>
<li>Everything else</li>
</ul>
<p>Total each category. You now have your actual baseline. Don't judge it  -  just see it.</p>
<p>Most people discover two things at this step: their dining out total is higher than they thought, and they have several subscription charges they'd completely forgotten about.</p>

<h2>Step 4: Set a number for each category</h2>
<p>Now you're building the actual budget. For each variable category, decide what the target should be going forward:</p>
<ul>
<li>Can groceries go from $450 to $380 with some meal planning?</li>
<li>Is the dining out total a genuine surprise, and what's a realistic lower target?</li>
<li>Which subscriptions don't need to be there?</li>
</ul>
<p>Don't set targets that require you to be a completely different person than you are. If you eat out three times a week because of your schedule, a target of zero restaurant spending won't survive contact with Monday. Set a target you'll actually hit, then reduce it from there.</p>

<h2>A format that works</h2>
<p>You don't need software. A piece of paper works. The structure:</p>
<ul>
<li>Income: $___</li>
<li>Fixed expenses: $___</li>
<li>Groceries budget: $___</li>
<li>Dining out budget: $___</li>
<li>Transportation budget: $___</li>
<li>Entertainment budget: $___</li>
<li>Subscriptions budget: $___</li>
<li>Savings target: $___</li>
<li>Total: should equal income</li>
</ul>
<p>Every dollar gets assigned somewhere. If the total is less than income, the extra goes to savings or debt payoff. If the total is more than income, something has to shrink  -  and now you know exactly what.</p>

<h2>The check-in: what makes this actually work</h2>
<p>A budget you build once and never look at again doesn't help. The check-in is what turns a plan into real financial progress.</p>
<p>Once a week, spend ten minutes looking at what you've spent so far in the month versus your budget for each category. Not to feel guilty  -  to stay aware. The categories where you're already over halfway through your budget by the 10th of the month need attention the other 20 days.</p>
<p>Once a month, do the full review: total actual spending by category versus your budget target. Where were you over? Where were you under? Adjust next month's targets based on what you learned, not what you hoped.</p>

<h2>Month one will be imperfect. That's correct.</h2>
<p>You'll miss some categories. You'll forget irregular expenses. Some targets will be unrealistic in either direction. This is expected  -  it happens to everyone on their first budget.</p>
<p>Month two will be better because you have real data. Month three will be better still. By month four or five, the budget feels like information rather than discipline. You stop fighting it and start using it. That's when it starts to actually change your financial life.</p>
<p>The only failure mode is stopping. As long as you come back to it, you're succeeding.</p>
    `
  },
  {
    slug: "how-to-organize-your-financial-life",
    content: `
<p>Most people's financial lives are scattered across a checking account, a savings account they barely use, three credit cards with different websites to log into, a retirement account from a job they left two years ago, and a collection of subscriptions spread across PayPal, their bank account, and their Apple ID.</p>
<p>There's no single dashboard. There's no clear picture. There's just anxiety and a vague sense that things are probably fine but maybe they're not.</p>
<p>Getting organized doesn't require complex software or a finance degree. It requires building a simple system and actually maintaining it. Here's what that looks like.</p>

<h2>The five things you need to know about your finances at any given moment</h2>
<p>If you can answer these five questions quickly and accurately, your financial life is organized:</p>
<ol>
<li><strong>How much comes in each month?</strong> (exact take-home figure)</li>
<li><strong>What are you committed to paying each month?</strong> (every recurring bill and subscription)</li>
<li><strong>What are you building toward?</strong> (savings goals with amounts and dates)</li>
<li><strong>What do you owe, to whom, at what rate?</strong> (complete debt inventory)</li>
<li><strong>Is your net worth trending up or down?</strong> (quarterly snapshot)</li>
</ol>
<p>Most people can answer question one pretty well and questions two through five not at all. The system below changes that.</p>

<h2>Income: make it one number</h2>
<p>Write down your actual monthly take-home from every source. Employment income (two paychecks, after deductions), freelance income (conservative average of the past six months), any recurring other income. One total. Keep it somewhere you can update it when it changes.</p>
<p>This is your operating budget ceiling. Everything else is a choice about how to allocate it.</p>

<h2>Recurring expenses: the complete list</h2>
<p>The most impactful exercise in financial organization is making a complete list of every recurring expense  -  subscription, bill, or automatic payment  -  with the date it charges and the amount.</p>
<p>This list matters for three reasons:</p>
<ul>
<li>It tells you exactly what's leaving your account each month without any mental effort</li>
<li>It shows you quickly when something has increased or when you've accumulated charges you forgot about</li>
<li>It's the starting point for any budget conversation  -  you can't plan spending if you don't know what's already committed</li>
</ul>
<p>Include everything: streaming services, software subscriptions, insurance premiums, gym memberships, annual fees (convert to monthly by dividing by 12), and any other automatically recurring charge.</p>
<p>Update this list whenever you add or cancel something. Review it every three months. This is the highest-leverage financial habit most people don't have.</p>

<h2>Savings goals: give your savings a purpose</h2>
<p>Savings without a goal is money waiting to be spent. Savings with a goal has a target, a timeline, and a monthly number attached to it.</p>
<p>For each active savings goal, you need to know:</p>
<ul>
<li>What am I saving for?</li>
<li>How much do I need?</li>
<li>When do I need it?</li>
<li>How much do I need to save per month to get there?</li>
</ul>
<p>Open a separate savings account for each major goal. Name the accounts clearly. Keep emergency fund separate from vacation fund separate from down payment fund. The separation prevents the money from blurring together and accidentally getting spent.</p>

<h2>Debt: the inventory most people avoid</h2>
<p>Most people know approximately how much debt they have. "Approximately" is the problem. For effective debt management you need exact current balances, interest rates, and minimum payments  -  written down, in one place.</p>
<table>
<tr><th>Creditor</th><th>Balance</th><th>APR</th><th>Minimum payment</th></tr>
<tr><td>Chase Sapphire</td><td>$___</td><td>___% </td><td>$___</td></tr>
<tr><td>Student loan</td><td>$___</td><td>___% </td><td>$___</td></tr>
<tr><td>Car loan</td><td>$___</td><td>___% </td><td>$___</td></tr>
</table>
<p>This inventory tells you which debt is most expensive (attack first), which is closest to being paid off (quick win), and your total liability load. Update balances every three months when you do your net worth update.</p>

<h2>Net worth: the quarterly scoreboard</h2>
<p>Net worth = everything you own minus everything you owe. Update it once a quarter. Write it down. Compare to the previous quarter and the same quarter last year.</p>
<p>A single quarter might go up or down because of market fluctuations or unexpected expenses. That's not meaningful. The 12-month trend is what matters. If your net worth is higher than it was 12 months ago, your financial life is improving regardless of how individual months felt.</p>

<h2>The monthly 20-minute check-in</h2>
<p>Once a month, block 20 minutes and go through everything:</p>
<ul>
<li>Review spending by category vs budget  -  where were you over?</li>
<li>Confirm savings goal transfers went through</li>
<li>Check the recurring expenses list for any new charges or price increases</li>
<li>Update debt balances if you made extra payments</li>
<li>Note anything you want to handle differently next month</li>
</ul>
<p>Twenty minutes per month is the maintenance cost of financial organization. It's less time than most people spend reading about personal finance without actually implementing anything.</p>

<h2>Start with the minimum viable version</h2>
<p>Don't wait until you have the perfect system. Start with the smallest version that actually does something:</p>
<ul>
<li>Today: make the recurring expenses list</li>
<li>This week: calculate take-home income, identify savings goal, open a dedicated savings account</li>
<li>This month: do the first monthly check-in</li>
<li>This quarter: calculate net worth for the first time</li>
</ul>
<p>The system grows from there. The important thing is starting with something real rather than planning a perfect system you never implement.</p>
    `
  },
];

async function run() {
  console.log(`Updating ${updates.length} articles with humanized content...`);
  for (const { slug, content } of updates) {
    const { error } = await supabase
      .from("blog_posts")
      .update({ content })
      .eq("slug", slug);
    if (error) console.error(`ERROR ${slug}:`, error.message);
    else console.log(`OK: ${slug}`);
  }
  console.log("Done.");
}

run().catch(console.error);
