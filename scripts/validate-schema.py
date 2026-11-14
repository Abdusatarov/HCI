from lxml import etree as E
schema=E.XMLSchema(E.parse('scripts/bpmn-schema/BPMN20.xsd'))
schema.assertValid(E.parse('diagrams/pharmacy-order.bpmn'))
print('PASS: OMG BPMN 2.0 XSD validation')
