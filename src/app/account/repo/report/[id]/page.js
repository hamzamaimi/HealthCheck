import {
  ClockIcon,
  CodeBracketIcon,
  LanguageIcon,
  StarIcon,
  TicketIcon,
} from "@heroicons/react/20/solid";
import { getServerSession } from "next-auth/next";
import { formatDistance } from "date-fns";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/models/db";
import Heading from "@/components/Heading";
import List from "@/components/List";
import Stats from "@/components/Stats";
import { checkSummary } from "@/utils/checks";

export default async function Page({ params }) {
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const check = await prisma.check.findUnique({
    where: { id },
    include: {
      repository: {
        include: {
          user: true,
        },
      },
      githubResponse: true,
    },
  });

  // TODO add to above query and redirect if no result
  if (session.user.id !== check.repository.user.id) {
    redirect("/");
  }

  const summary = checkSummary(check.data);

  return (
    <>
      <Heading
        title={`${check.repository.owner} / ${check.repository.repo}`}
        actions={[
          {
            text: "GitHub Repo",
            url: check.repository.url,
            icon: CodeBracketIcon,
          },
        ]}
        extras={[
          { icon: StarIcon, text: check.githubResponse.repo.stargazers_count },
          { icon: LanguageIcon, text: check.githubResponse.repo.language },
          {
            icon: ClockIcon,
            text: formatDistance(
              check.githubResponse.repo.updated_at,
              new Date(),
              {
                addSuffix: true,
              }
            ),
          },
          { icon: TicketIcon, text: check.githubResponse.repo.open_issues },
        ]}
      />
      <Stats
        data={[
          {
            name: "Success",
            stat: summary.success?.length || 0,
            status: "success",
          },
          {
            name: "Warning",
            stat: summary.warning?.length || 0,
            status: "warning",
          },
          { name: "Error", stat: summary.error?.length || 0, status: "error" },
        ]}
      />
      <List
        data={check.data.map((check) => ({
          id: check.id,
          href: `/checks/${check.id}`,
          title: check.title,
          status: check.status,
          extra: check.extra,
          description: check.description,
        }))}
      />
    </>
  );
}
