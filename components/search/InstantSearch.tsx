import { Hit } from "instantsearch.js"
import { useCallback, useEffect, useState } from "react"
import {
  CurrentRefinements,
  Highlight,
  Hits,
  InstantSearch as Base,
  Pagination,
  RefinementList,
  SearchBox
} from "react-instantsearch-hooks-web"
import TypesenseInstantSearchAdapter, {
  TypesenseInstantsearchAdapterOptions
} from "typesense-instantsearch-adapter"
import { Button, Card, Col, Container, Offcanvas, Row } from "../bootstrap"
import { Internal } from "../links"

const devConfig = {
  key: "iklz4D0Yv3lEYpYxf3e8LQr6tDlIlrvo",
  url: "https://maple.aballslab.com/search"
}

function getServerConfig(): TypesenseInstantsearchAdapterOptions["server"] {
  const key = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY ?? devConfig.key
  const url = new URL(
    process.env.NEXT_PUBLIC_TYPESENSE_API_URL ?? devConfig.url
  )

  const protocol = url.protocol.startsWith("https") ? "https" : "http"
  const port = url.port ? Number(url.port) : protocol === "https" ? 443 : 80

  return {
    apiKey: key,
    nodes: [
      {
        host: url.hostname,
        protocol,
        port,
        path: url.pathname
      }
    ]
  }
}

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: getServerConfig(),
  additionalSearchParameters: {
    query_by: "number,title,body",
    exclude_fields: "body"
  }
})

const searchClient = typesenseInstantsearchAdapter.searchClient

type BillRecord = {
  number: string
  title: string
  city?: string
  currentCommittee?: string
  testimonyCount: number
  primarySponsor?: string
}

export const InstantSearch = () => {
  const refinements = useRefinements()
  return (
    <Base indexName="bills" searchClient={searchClient} routing>
      <Container>
        <Row>
          {refinements.options}
          <Col className="d-flex flex-column">
            <SearchBox placeholder="Search Bills" className="mb-1" />
            <div className="d-flex">
              <CurrentRefinements />
              {refinements.show}
            </div>
            <Hits hitComponent={Hit} />
            <Pagination className="mx-auto mt-2 mb-3" />
          </Col>
        </Row>
      </Container>
    </Base>
  )
}

const Hit = ({ hit }: { hit: Hit<BillRecord> }) => {
  return (
    <Card className="mt-1 mb-1 w-100">
      <Card.Body>
        <Card.Title>
          <Highlight attribute="title" hit={hit} />
        </Card.Title>
        <Card.Subtitle>
          <Internal href={`/bill?id=${hit.number}`}>{hit.number}</Internal>
        </Card.Subtitle>
      </Card.Body>
    </Card>
  )
}

const useRefinements = () => {
  // TODO: lift up refinement state and make UI responsive. for now, don't
  // bother.
  const inline = true
  // Grab the value on mount, to ensure it maintains its state.
  // const { current: inline } = useRef(useMediaQuery("(min-width: 768px)"))
  const [show, setShow] = useState(false)
  const handleClose = useCallback(() => setShow(false), [])
  const handleOpen = useCallback(() => setShow(true), [])

  useEffect(() => {
    if (inline) setShow(false)
  }, [inline])

  const refinements = (
    <>
      <RefinementList
        attribute="city"
        limit={5}
        searchable
        searchablePlaceholder="City"
      />
      <RefinementList
        className="mt-3"
        attribute="primarySponsor"
        limit={5}
        searchable
        searchablePlaceholder="Primary Sponsor"
      />
      <RefinementList
        className="mt-3"
        attribute="currentCommittee"
        limit={5}
        searchable
        searchablePlaceholder="Current Committee"
      />
    </>
  )

  return {
    options: inline ? (
      <Col xs={3} lg={2}>
        {refinements}
      </Col>
    ) : (
      // TODO: fix this somehow...use hook and render custom components...
      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Filter</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>{refinements}</Offcanvas.Body>
      </Offcanvas>
    ),
    show: inline ? null : (
      <Button active={show} onClick={handleOpen}>
        Filter
      </Button>
    )
  }
}