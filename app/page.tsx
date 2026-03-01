import Link from "next/link";
import { Container, Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";

export default function Home() {
  return (
    <Container>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold">Anabolic Kitchen</div>
          <div className="text-text2 mt-1">Rețete proteice + calculator caloric + tracker, într-un sistem închis.</div>
        </div>
        <div className="flex gap-2">
          <Link href="/login"><Button variant="ghost">Autentificare</Button></Link>
          <Link href="/login?mode=register"><Button>Începe</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader title="Macro plan personalizat" subtitle="Ținte zilnice automate" />
          <CardBody>
            <div className="text-text2 text-sm">
              Introduci datele, iar aplicația calculează calorii și macros pentru obiectivul tău.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>15% deficit (slăbire)</Badge>
              <Badge>2.0 g/kg proteină</Badge>
              <Badge>0.8 g/kg grăsimi</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Bibliotecă de rețete" subtitle="30 rețete la lansare" />
          <CardBody>
            <div className="text-text2 text-sm">
              Rețete curate, porții scalabile, pași simpli, macros clare pe porție.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Mic dejun</Badge><Badge>Prânz</Badge><Badge>Cină</Badge><Badge>Gustări</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tracker simplu" subtitle="Doar din rețetele aplicației" />
          <CardBody>
            <div className="text-text2 text-sm">
              Adaugi o rețetă la ziua curentă și vezi instant cât mai ai din calorii și macros.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Fără alimente manuale</Badge>
              <Badge>Fără share</Badge>
              <Badge>Sistem închis</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-8 text-text2 text-sm">
        Notă: accesul este pe bază de cont. Paywall-ul de abonament (Stripe) îl activăm după ce rulează MVP-ul cap-coadă.
      </div>
    </Container>
  );
}
